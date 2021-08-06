# Stemhub:Bit

Extension for Stemhub Smart Car. Stemhub bit is an useful extension to control our Stemhub Car.
With this extension, techers can teach students how to write program to complete tasks.

Some examples of tasks:
- Programming the micro:bit car motor and speed
- Using Ultrasonic senor
- Avoid barries
- Line follower
- Maze Solver

![Stemhub Car](https://github.com/stemhub/pxt-Stemhubbit/blob/master/icon.png)

For more information, please visit https://www.stemeshop.com/product-page/micro-bit-%E6%99%BA%E8%83%BD%E5%B0%8F%E8%BB%8A

## Features of the board

- On board battery with usb charging
- Drive 8x servos and 4x DC motors at the same time (with 3.7v battery)
- Drive 2x Micro Stepper Motors
- On board buzzer
- On board 4x RGB Neo Pixels
- 2xPH2.0-4Pin for i2c port and RGB Ultrasonic
- 4xPH2.0-2Pin for DC motors

## Code Examples

Control the lights

```JavaScript
//turn the Ultrasonic Light red
stemhubbit.UltrasonicLight(RgbUltrasonics.All, NeoPixelColors.Red)
//turn the on-board light blue
stemhubbit.OnBoardLight(OnBoardLightOffset.ALL, NeoPixelColors.Blue)
```

Control the Servo

```JavaScript
//turning servo 90 degree
stemhubbit.Servo(stemhubbit.Servos.S1, 90)
```

Control the Car motor

```JavaScript
//car move forward
stemhubbit.MotorRunDual(stemhubbit.Motors.M1, 150, stemhubbit.Motors.M2, 150)
stemhubbit.MotorRunDual(stemhubbit.Motors.M3, 150, stemhubbit.Motors.M4, 150)
basic.pause(1000)
//stop the car
stemhubbit.MotorStopAll()
```

Read the Ultrasonic sensor distance

```JavaScript
let distance = stemhubbit.ReadUltrasonic()
```

Obstacle avoidance using Ultrasonic sensor

```JavaScript
let distance = 0
basic.forever(function () {
    distance = stemhubbit.ReadUltrasonic()
    if (distance < 20 && distance != 0) {
        //stop the car and turn
        stemhubbit.MotorStopAll()
        basic.pause(100)
        stemhubbit.MotorRunDual(stemhubbit.Motors.M1, -80, stemhubbit.Motors.M2, 80)
        stemhubbit.MotorRunDual(stemhubbit.Motors.M3, -80, stemhubbit.Motors.M4, 80)
        basic.pause(1900)
    } else {
        //move forward
        stemhubbit.MotorRunDual(stemhubbit.Motors.M1, 50, stemhubbit.Motors.M2, 50)
        stemhubbit.MotorRunDual(stemhubbit.Motors.M3, 50, stemhubbit.Motors.M4, 50)
    }
    basic.pause(100)
})
```

Moving the Stepper Car (if Stepper motor is used)

```JavaScript
stemhubbit.StpCarMove(10, 48)
```

## Supported targets
for PXT/microbit

## License
MIT
