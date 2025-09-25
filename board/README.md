# ESP32 Temperature Meter Firmware

This directory contains the PlatformIO project for the ESP32-based temperature meter.

## Project Overview

This firmware is designed to run on an ESP32 DOIT DEVKIT V1 board. It reads temperature data from a DS18B20 temperature sensor and sends it to an MQTT broker. It also provides a web interface for initial configuration of WiFi and MQTT settings.

## Features

-   **WiFi Configuration:** Provides a web-based wizard to connect the device to a WiFi network.
-   **MQTT Communication:** Publishes temperature readings to a specified MQTT topic.
-   **Temperature Sensing:** Reads temperature from a DS18B20 sensor.
-   **Web Server:** A simple async web server for configuration and status monitoring.
-   **LittleFS Storage:** Uses LittleFS to store configuration files (`mqtt.json`).

## Hardware Requirements

-   **Board:** ESP32 DOIT DEVKIT V1 (or a similar ESP32 development board).
-   **Sensor:** DS18B20 temperature sensor.
-   **Resistor:** 4.7kΩ pull-up resistor for the DS18B20 data line.

## Software Dependencies (Libraries)

The project relies on the following libraries, which are managed by PlatformIO via the `platformio.ini` file:

-   `AsyncTCP`
-   `ESPAsyncWebServer`
-   `DallasTemperature`
-   `OneWire`
-   `PubSubClient`
-   `ArduinoJson`
-   `LittleFS`

## Building and Uploading

This project is built using [PlatformIO](https://platformio.org/).

1.  **Install PlatformIO:** Follow the instructions on the official PlatformIO website to install the VS Code extension.
2.  **Open Project:** Open the root of this repository in VS Code.
3.  **Connect Board:** Connect your ESP32 board to your computer via USB.
4.  **Build:** Use the PlatformIO "Build" task to compile the firmware.
5.  **Upload Filesystem Image:** The web interface files are stored in the `data` directory. You need to upload this to the ESP32's LittleFS filesystem. Use the PlatformIO "Upload Filesystem Image" task.
6.  **Upload Firmware:** Use the PlatformIO "Upload" task to flash the firmware to the board.
7.  **Monitor:** Use the PlatformIO "Monitor" task to view serial output from the device.

## Configuration

On the first boot, the device will start in Access Point (AP) mode.

1.  Connect to the WiFi network named `ESP32-Temp-Meter-Setup`.
2.  Open a browser and navigate to `http://192.168.4.1`.
3.  Follow the on-screen wizard to connect the device to your local WiFi network and configure the MQTT broker settings.
4.  The configuration will be saved to `mqtt.json` in the LittleFS filesystem.

After configuration, the device will restart and connect to the configured WiFi and MQTT broker.


<p align="center">
	<img src="Untitled diagram _ Mermaid Chart-2025-09-25-123502.png" alt="Initial provisioning and configuration flow diagram" width="680" />
	<br />
	<em>Figure 1. Device first‑boot provisioning: the ESP32 starts in AP mode, user connects to the setup portal, submits WiFi + MQTT credentials, which are persisted to LittleFS before the device reboots into normal operation.</em>
</p>



<p align="center">
	<img src="Untitled diagram _ Mermaid Chart-2025-09-25-123912.png" alt="Normal operation data flow diagram" width="680" />
	<br />
	<em>Figure 2. Normal runtime data path: sensor → ESP32 (periodic read & validation) → MQTT publish → backend / consumers; includes reconnection handling and status reporting.</em>
</p>