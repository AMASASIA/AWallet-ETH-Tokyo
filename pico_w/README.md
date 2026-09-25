# Raspberry Pi Pico W Hardware Tap Switch for AWallet

This folder contains the MicroPython firmware for the physical hardware tap switch used in AWallet hackathon demonstrations.

## 1. Hardware Pinout
- **GPIO 14 (Pin 19)**: Connect to one terminal of the tactile push button.
- **GND (Pin 18 or 23)**: Connect to the other terminal of the tactile push button.
- **Internal Pull-up**: Handled in software (`Pin.PULL_UP`).
- **Onboard LED**: Blinks during Wi-Fi connection and flashes on tap event transmission.

## 2. Setup Instructions (Thonny / mpremote)
1. Flash official MicroPython UF2 firmware to your Pico W.
2. Open Thonny IDE and connect to the Raspberry Pi Pico W.
3. Copy `wifi_config.example.py` to `wifi_config.py` on the device:
   - Set `WIFI_SSID` to the hackathon or mobile hotspot Wi-Fi name.
   - Set `WIFI_PASSWORD` to your Wi-Fi password.
   - Set `SERVER_URL` to the host running AWallet (e.g. `http://192.168.x.x:3000` or Cloud Run URL).
   - Set `TAP_DEVICE_SECRET` to match `TAP_DEVICE_SECRET` in `.env`.
4. Upload `pico_tap_switch.py` to the Pico W as `main.py` if you want it to run on boot.

## 3. Testing with AWallet
- When the physical button is pressed, Pico W issues:
  `POST /api/tap/press` with `x-device-secret: <TAP_DEVICE_SECRET>`
- AWallet detects the physical tap and automatically authorizes pending Tier 2/3 Invisible Finance transactions!
