"""
Raspberry Pi Pico W — Physical Hardware Tap Switch for AWallet
Integrates physical button press with AWallet /api/tap/press endpoint.

IMPORTANT SECURITY NOTICE:
Wi-Fi credentials and API secrets MUST NOT be written in this file.
They are loaded from `wifi_config.py` (which is gitignored).
"""

import time
import network
import urequests
from machine import Pin

# Load configuration safely from external config file
try:
    import wifi_config
    SSID = wifi_config.WIFI_SSID
    PASSWORD = wifi_config.WIFI_PASSWORD
    SERVER_URL = getattr(wifi_config, "SERVER_URL", "http://192.168.1.100:3000")
    TAP_SECRET = getattr(wifi_config, "TAP_DEVICE_SECRET", "a-wallet-pico-secret-2026")
except ImportError:
    print("[ERROR] wifi_config.py not found! Please copy wifi_config.example.py to wifi_config.py and set your credentials.")
    SSID = None
    PASSWORD = None
    SERVER_URL = "http://localhost:3000"
    TAP_SECRET = ""

# Hardware Pins: GP14 for Push Button (Active LOW with internal Pull-up), Onboard LED
button_pin = Pin(14, Pin.IN, Pin.PULL_UP)
try:
    led = Pin("LED", Pin.OUT)
except Exception:
    led = Pin(25, Pin.OUT)

def connect_wifi():
    """Connect to Wi-Fi network."""
    if not SSID or not PASSWORD:
        print("[WiFi] Missing credentials in wifi_config.py")
        return False

    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print(f"[WiFi] Connecting to {SSID}...")
        wlan.connect(SSID, PASSWORD)
        retries = 20
        while not wlan.isconnected() and retries > 0:
            led.toggle()
            time.sleep(0.5)
            retries -= 1

    if wlan.isconnected():
        print(f"[WiFi] Connected! IP: {wlan.ifconfig()[0]}")
        led.value(1)
        time.sleep(0.5)
        led.value(0)
        return True
    else:
        print("[WiFi] Connection failed!")
        return False

def send_tap_event(device_id="pico_w_tap_01", action_id=None):
    """Send tap event to AWallet backend."""
    url = f"{SERVER_URL}/api/tap/press"
    headers = {
        "Content-Type": "application/json",
        "x-device-secret": TAP_SECRET
    }
    payload = {
        "secret": TAP_SECRET,
        "deviceId": device_id,
        "actionId": action_id
    }

    try:
        print(f"[Pico] Sending TAP to {url}...")
        res = urequests.post(url, json=payload, headers=headers)
        print(f"[Pico] Response: {res.status_code} - {res.text}")
        res.close()
        return True
    except Exception as e:
        print(f"[Pico] Network error: {e}")
        return False

def main():
    print("=== AWallet Pico W Tap Switch Started ===")
    connected = connect_wifi()
    last_state = 1
    last_press_time = 0

    while True:
        current_state = button_pin.value()
        now = time.ticks_ms()

        # Detect falling edge (button pressed) with 300ms debounce
        if last_state == 1 and current_state == 0:
            if time.ticks_diff(now, last_press_time) > 300:
                last_press_time = now
                print("[Button] Physical TAP Detected!")
                led.value(1)
                send_tap_event()
                led.value(0)

        last_state = current_state
        time.sleep(0.02)

if __name__ == "__main__":
    main()
