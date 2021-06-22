//% color="#0000F0" weight=10 icon="\uf0f4" block="Stemhub:bit"
//% groups='["舵機 (Servo)", "步進 (Stepper)", "馬達 (Motor)", "超聲波 (Ultrasonic)", "板載燈 (Light)", "LED矩陣 (LEDMatrix)"]'
namespace stemhubbit {
    const PCA9685_ADDRESS = 0x40
    const MODE1 = 0x00
    const MODE2 = 0x01
    const SUBADR1 = 0x02
    const SUBADR2 = 0x03
    const SUBADR3 = 0x04
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06
    const LED0_ON_H = 0x07
    const LED0_OFF_L = 0x08
    const LED0_OFF_H = 0x09
    const ALL_LED_ON_L = 0xFA
    const ALL_LED_ON_H = 0xFB
    const ALL_LED_OFF_L = 0xFC
    const ALL_LED_OFF_H = 0xFD

    const STP_CHA_L = 2047
    const STP_CHA_H = 4095

    const STP_CHB_L = 1
    const STP_CHB_H = 2047

    const STP_CHC_L = 1023
    const STP_CHC_H = 3071

    const STP_CHD_L = 3071
    const STP_CHD_H = 1023

    // HT16K33 commands
    const HT16K33_ADDRESS = 0x70
    const HT16K33_BLINK_CMD = 0x80
    const HT16K33_BLINK_DISPLAYON = 0x01
    const HT16K33_BLINK_OFF = 0
    const HT16K33_BLINK_2HZ = 1
    const HT16K33_BLINK_1HZ = 2
    const HT16K33_BLINK_HALFHZ = 3
    const HT16K33_CMD_BRIGHTNESS = 0xE0

    export enum Servos {
        S1 = 0x01,
        S2 = 0x02,
        S3 = 0x03,
        S4 = 0x04,
        S5 = 0x05,
        S6 = 0x06,
        S7 = 0x07,
        S8 = 0x08
    }

    export enum Motors {
        M1 = 0x3,
        M2 = 0x4,
        M3 = 0x1,
        M4 = 0x2
    }

    export enum Steppers {
        M1 = 0x1,
        M2 = 0x2
    }

    export enum SonarVersion {
        V1 = 0x1,
        V2 = 0x2
    }

    export enum Turns {
        //% blockId="T1B4" block="1/4"
        T1B4 = 90,
        //% blockId="T1B2" block="1/2"
        T1B2 = 180,
        //% blockId="T1B0" block="1"
        T1B0 = 360,
        //% blockId="T2B0" block="2"
        T2B0 = 720,
        //% blockId="T3B0" block="3"
        T3B0 = 1080,
        //% blockId="T4B0" block="4"
        T4B0 = 1440,
        //% blockId="T5B0" block="5"
        T5B0 = 1800
    }

    let initialized = false
    let initializedMatrix = false
    let neoStrip: neopixel.Strip;
    let matBuf = pins.createBuffer(17);
    let distanceBuf = 0;

    function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2ccmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function initPCA9685(): void {
        i2cwrite(PCA9685_ADDRESS, MODE1, 0x00)
        setFreq(50);
        for (let idx = 0; idx < 16; idx++) {
            setPwm(idx, 0, 0);
        }
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval; //Math.Floor(prescaleval + 0.5);
        let oldmode = i2cread(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cwrite(PCA9685_ADDRESS, MODE1, newmode); // go to sleep
        i2cwrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;
        //serial.writeValue("ch", channel)
        //serial.writeValue("on", on)
        //serial.writeValue("off", off)

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }

    function setStepper(index: number, dir: boolean): void {
        if (index == 1) {
            if (dir) {
                setPwm(0, STP_CHA_L, STP_CHA_H);
                setPwm(2, STP_CHB_L, STP_CHB_H);
                setPwm(1, STP_CHC_L, STP_CHC_H);
                setPwm(3, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(3, STP_CHA_L, STP_CHA_H);
                setPwm(1, STP_CHB_L, STP_CHB_H);
                setPwm(2, STP_CHC_L, STP_CHC_H);
                setPwm(0, STP_CHD_L, STP_CHD_H);
            }
        } else {
            if (dir) {
                setPwm(4, STP_CHA_L, STP_CHA_H);
                setPwm(6, STP_CHB_L, STP_CHB_H);
                setPwm(5, STP_CHC_L, STP_CHC_H);
                setPwm(7, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(7, STP_CHA_L, STP_CHA_H);
                setPwm(5, STP_CHB_L, STP_CHB_H);
                setPwm(6, STP_CHC_L, STP_CHC_H);
                setPwm(4, STP_CHD_L, STP_CHD_H);
            }
        }
    }

    function stopMotor(index: number) {
        setPwm((index - 1) * 2, 0, 0);
        setPwm((index - 1) * 2 + 1, 0, 0);
    }

    function matrixInit() {
        i2ccmd(HT16K33_ADDRESS, 0x21);// turn on oscillator
        i2ccmd(HT16K33_ADDRESS, HT16K33_BLINK_CMD | HT16K33_BLINK_DISPLAYON | (0 << 1));
        i2ccmd(HT16K33_ADDRESS, HT16K33_CMD_BRIGHTNESS | 0xF);
    }

    function matrixShow() {
        matBuf[0] = 0x00;
        pins.i2cWriteBuffer(HT16K33_ADDRESS, matBuf);
    }


    /**
     * Init RGB pixels mounted on stemhub car
     */
    //% blockId="stemhubbit_rgb" block="RGB Light"
    //% weight=5
    //% group="LED矩陣 (LEDMatrix)"
    export function rgb(): neopixel.Strip {
        if (!neoStrip) {
            neoStrip = neopixel.create(DigitalPin.P16, 10, NeoPixelMode.RGB)
        }
        return neoStrip;
    }

    /**
     * Servo Execute
     * @param degree [0-180] degree of servo; eg: 0, 90, 180
    */
    //% blockId=stemhubbit_servo block="Servo|%index|degree %degree"
    //% weight=100
    //% degree.min=0 degree.max=180
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    //% group="舵機 (Servo)"
    export function Servo(index: Servos, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        // 50hz: 20,000 us
        let v_us = (degree * 1800 / 180 + 600) // 0.6 ~ 2.4
        let value = v_us * 4096 / 20000
        setPwm(index + 7, 0, value)
    }

    /**
     * Geek Servo
     * @param degree [-45-225] degree of servo; eg: -45, 90, 225
    */
    //% blockId=stemhubbit_gservo block="Geek Servo|%index|degree %degree"
    //% weight=99
    //% degree.min=-45 degree.max=225
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    //% group="舵機 (Servo)"
    export function GeekServo(index: Servos, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        // 50hz: 20,000 us
        let v_us = ((degree - 90) * 20 / 3 + 1500) // 0.6 ~ 2.4
        let value = v_us * 4096 / 20000
        setPwm(index + 7, 0, value)
    }

    //% blockId=stemhubbit_stepper_degree block="Stepper 28BYJ-48|%index|degree %degree"
    //% weight=90
    //% group="步進 (Stepper)"
    export function StepperDegree(index: Steppers, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        setStepper(index, degree > 0);
        degree = Math.abs(degree);
        basic.pause(10240 * degree / 360);
        MotorStopAll()
    }


    //% blockId=stemhubbit_stepper_turn block="Stepper 28BYJ-48|%index|turn %turn"
    //% weight=90
    //% group="步進 (Stepper)"
    export function StepperTurn(index: Steppers, turn: Turns): void {
        let degree = turn;
        StepperDegree(index, degree);
    }

    //% blockId=stemhubbit_stepper_dual block="Dual Stepper(Degree) |M1 %degree1| M2 %degree2"
    //% weight=89
    //% group="步進 (Stepper)"
    export function StepperDual(degree1: number, degree2: number): void {
        if (!initialized) {
            initPCA9685()
        }
        setStepper(1, degree1 > 0);
        setStepper(2, degree2 > 0);
        degree1 = Math.abs(degree1);
        degree2 = Math.abs(degree2);
        basic.pause(10240 * Math.min(degree1, degree2) / 360);
        if (degree1 > degree2) {
            stopMotor(3); stopMotor(4);
            basic.pause(10240 * (degree1 - degree2) / 360);
        } else {
            stopMotor(1); stopMotor(2);
            basic.pause(10240 * (degree2 - degree1) / 360);
        }

        MotorStopAll()
    }

    /**
     * Stepper Car move forward
     * @param distance Distance to move in cm; eg: 10, 20
     * @param diameter diameter of wheel in mm; eg: 48
    */
    //% blockId=stemhubbit_stpcar_move block="Car Forward|Distance(cm) %distance|Wheel Diameter(mm) %diameter"
    //% weight=88
    //% group="步進 (Stepper)"
    export function StpCarMove(distance: number, diameter: number): void {
        if (!initialized) {
            initPCA9685()
        }
        let delay = 10240 * 10 * distance / 3 / diameter; // use 3 instead of pi
        setStepper(1, delay > 0);
        setStepper(2, delay > 0);
        delay = Math.abs(delay);
        basic.pause(delay);
        MotorStopAll()
    }

    /**
     * Stepper Car turn by degree
     * @param turn Degree to turn; eg: 90, 180, 360
     * @param diameter diameter of wheel in mm; eg: 48
     * @param track track width of car; eg: 125
    */
    //% blockId=stemhubbit_stpcar_turn block="Car Turn|Degree %turn|Wheel Diameter(mm) %diameter|Track(mm) %track"
    //% weight=87
    //% blockGap=50
    //% group="步進 (Stepper)"
    export function StpCarTurn(turn: number, diameter: number, track: number): void {
        if (!initialized) {
            initPCA9685()
        }
        let delay = 10240 * turn * track / 360 / diameter;
        setStepper(1, delay < 0);
        setStepper(2, delay > 0);
        delay = Math.abs(delay);
        basic.pause(delay);
        MotorStopAll()
    }

    /**
     * Execute single motor
     * @param speed [-255-255] speed of motor; eg: 150, -150
    */
    //% blockId=stemhubbit_motor_run block="Motor|%index|speed %speed"
    //% weight=85
    //% speed.min=-255 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    //% group="馬達 (Motor)"
    export function MotorRun(index: Motors, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        speed = speed * 16; // map 255 to 4096
        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }
        if (index > 4 || index <= 0)
            return
        let pp = (index - 1) * 2
        let pn = (index - 1) * 2 + 1
        if (speed >= 0) {
            setPwm(pp, 0, speed)
            setPwm(pn, 0, 0)
        } else {
            setPwm(pp, 0, 0)
            setPwm(pn, 0, -speed)
        }
    }


    /**
     * Execute two motors at the same time
     * @param speed1 [-255-255] speed of motor; eg: 150, -150
     * @param speed2 [-255-255] speed of motor; eg: 150, -150
    */
    //% blockId=stemhubbit_motor_dual block="Motor|%motor1|speed %speed1|%motor2|speed %speed2"
    //% weight=84
    //% speed1.min=-255 speed1.max=255
    //% speed2.min=-255 speed2.max=255
    //% inlineInputMode=inline
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    //% group="馬達 (Motor)"
    export function MotorRunDual(motor1: Motors, speed1: number, motor2: Motors, speed2: number): void {
        MotorRun(motor1, speed1);
        MotorRun(motor2, speed2);
    }

    /**
     * Execute single motor with delay
     * @param speed [-255-255] speed of motor; eg: 150, -150
     * @param delay second delay to stop; eg: 1
    */
    //% blockId=stemhubbit_motor_rundelay block="Motor|%index|speed %speed|delay %delay|s"
    //% weight=81
    //% speed.min=-255 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    //% group="馬達 (Motor)"
    export function MotorRunDelay(index: Motors, speed: number, delay: number): void {
        MotorRun(index, speed);
        basic.pause(delay * 1000);
        MotorRun(index, 0);
    }

    //% blockId=stemhubbit_stop block="Motor Stop|%index|"
    //% weight=80
    //% group="馬達 (Motor)"
    export function MotorStop(index: Motors): void {
        MotorRun(index, 0);
    }

    //% blockId=stemhubbit_stop_all block="Motor Stop All"
    //% weight=79
    //% blockGap=50
    //% group="馬達 (Motor)"
    export function MotorStopAll(): void {
        if (!initialized) {
            initPCA9685()
        }
        for (let idx = 1; idx <= 4; idx++) {
            stopMotor(idx);
        }
    }

    //% blockId=stemhubbit_matrix_draw block="Matrix Draw|X %x|Y %y"
    //% weight=69
    //% group="LED矩陣 (LEDMatrix)"
    export function MatrixDraw(x: number, y: number): void {
        if (!initializedMatrix) {
            matrixInit();
            initializedMatrix = true;
        }
        x = Math.round(x)
        y = Math.round(y)
        
        let idx = y * 2 + Math.idiv(x, 8);
        
        let tmp = matBuf[idx + 1];
        tmp |= (1 << (x % 8));
        matBuf[idx + 1] = tmp;
    }

    //% blockId=stemhubbit_matrix_refresh block="Matrix Refresh"
    //% weight=69
    //% group="LED矩陣 (LEDMatrix)"
    export function MatrixRefresh(): void {
        if (!initializedMatrix) {
            matrixInit();
            initializedMatrix = true;
        }
        matrixShow();
    }

    //% blockId=stemhubbit_matrix_clear block="Matrix Clear"
    //% weight=65
    //% blockGap=50
    //% group="LED矩陣 (LEDMatrix)"
    export function MatrixClear(): void {
        if (!initializedMatrix) {
            matrixInit();
            initializedMatrix = true;
        }
        for (let i = 0; i < 16; i++) {
            matBuf[i + 1] = 0;
        }
        matrixShow();
    }

    /**
     * Read Ultrasonic Distance(cm) on Pin2
     */
    //% blockId=stemhubbit_readultrasonic block="Ultrasonic|Distance(cm)"
    //% weight=10
    //% group="超聲波 (Ultrasonic)"
    export function ReadUltrasonic(): number {
        return RgbUltrasonic(DigitalPin.P2)
    }

    //% blockId=stemhubbit_rgbultrasonic block="Ultrasonic|Distance(cm)|pin %pin"
    //% weight=9
    //% group="超聲波 (Ultrasonic)"
    export function RgbUltrasonic(pin: DigitalPin): number {
        pins.setPull(pin, PinPullMode.PullNone);
        pins.digitalWritePin(pin, 0);
        control.waitMicros(2);
        pins.digitalWritePin(pin, 1);
        control.waitMicros(50);
        pins.digitalWritePin(pin, 0);
	    control.waitMicros(1000);
        while(!pins.digitalReadPin(pin));
        // read pulse
        let d = pins.pulseIn(pin, PulseValue.High, 25000);
        let ret = d;
        // filter timeout spikes
        if (ret == 0 && distanceBuf != 0) {
            ret = distanceBuf;
        }
        distanceBuf = d;
        return Math.floor(ret * 9 / 6 / 58);
    }
    
    /**
     * Setting On Board Lights
    */
    //% blockId="stemhubbit_onboardlight" block="On-board Light %index show color %color" 
    //% weight=78
    //% group="板載燈 (Light)"
    export function OnBoardLight(index: OnBoardLightOffset, color: NeoPixelColors) {
        if (index == OnBoardLightOffset.ALL) {
            rgb().range(0, 4).showColor(color)
        } else {
            rgb().setPixelColor(index, color)
            rgb().show()
        }
    }
    
    /**
     * Setting On Board Lights with brightness
     * @param brightness brightness of light; eg: 255
    */
    //% blockId="stemhubbit_onboardlightbrightness" block="On-board Light %index color %color brightness %brightness" 
    //% weight=77
    //% brightness.min=0 speed.max=255
    //% group="板載燈 (Light)"
    export function OnBoardLightBrightness(index: OnBoardLightOffset, color: NeoPixelColors, brightness: number) {
        let tmprgb: neopixel.Strip
        if (index == OnBoardLightOffset.ALL) {
            tmprgb = rgb().range(0, 4)
        } else {
            tmprgb = rgb().range(index, 1)
        }
        tmprgb.setBrightness(brightness)
        tmprgb.showColor(color)
    }

    //% blockId="stemhubbit_ultrasoniclight" block="Ultrasonic Light %index show color %color" 
    //% weight=7
    //% group="超聲波 (Ultrasonic)"
    export function UltrasonicLight(index: RgbUltrasonics, color: NeoPixelColors) {
        switch (index) {
            case RgbUltrasonics.Left:
            rgb().range(4, 3).showColor(color)
            break
            case RgbUltrasonics.Right:
            rgb().range(7, 3).showColor(color)
            break
            case RgbUltrasonics.All:
            rgb().range(4, 6).showColor(color)
            break
        }
    }
}
enum OnBoardLightOffset {
    //% block=one
    ONE = 0,
    //% block=two
    TWO = 1,
    //% block=three
    THREE = 2,
    //% block=four
    FOUR = 3,
    //% block=all
    ALL = 4
}
enum RgbUltrasonics {
    //% block=left
    Left = 0x00,
    //% block=right
    Right = 0x01,
    //% block=all
    All = 0x02
}
