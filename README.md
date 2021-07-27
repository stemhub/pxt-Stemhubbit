# Stemhub:Bit

Extension for Stemhub Smart Car

![Stemhub Car](https://github.com/stemhub/pxt-Stemhubbit/blob/master/img/stemhub_car.png)

## Features

- On board battery with usb charging
- Drive 8x servos and 4x DC motors at the same time (with 3.7v battery)
- Drive 2x Micro Stepper Motors
- On board buzzer
- On board 4x RGB Neo Pixels
- 2xPH2.0-4Pin for i2c port and RGB Ultrasonic
- 4xPH2.0-2Pin for DC motors

## Code Example
```JavaScript
let distance = 0
basic.forever(function () {
    distance = stemhubbit.ReadUltrasonic()
    if (distance < 20 && distance != 0) {
        stemhubbit.MotorStopAll()
        basic.pause(100)
        stemhubbit.MotorRunDual(stemhubbit.Motors.M1, -80, stemhubbit.Motors.M2, 80)
        stemhubbit.MotorRunDual(stemhubbit.Motors.M3, -80, stemhubbit.Motors.M4, 80)
        basic.pause(1900)
    } else {
        stemhubbit.MotorRunDual(stemhubbit.Motors.M1, 50, stemhubbit.Motors.M2, 50)
        stemhubbit.MotorRunDual(stemhubbit.Motors.M3, 50, stemhubbit.Motors.M4, 50)
    }
    basic.pause(100)
})
```

## Block Preview

![block_image](https://github.com/stemhub/pxt-Stemhubbit/blob/master/img/blocks.png)

## Supported targets
for PXT/microbit

## License
MIT
