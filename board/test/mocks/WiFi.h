#pragma once
#include "Arduino.h"

// ---- WiFi types ----
typedef uint8_t wl_status_t;

#define WL_CONNECTED 3
#define WL_DISCONNECTED 6
#define WL_NO_SHIELD 255
#define WL_IDLE_STATUS 0

typedef enum
{
  WIFI_AUTH_OPEN = 0,
  WIFI_AUTH_WEP,
  WIFI_AUTH_WPA_PSK,
  WIFI_AUTH_WPA2_PSK,
  WIFI_AUTH_WPA_WPA2_PSK,
  WIFI_AUTH_MAX
} wifi_auth_mode_t;

#define WIFI_SCAN_RUNNING (-1)
#define WIFI_SCAN_FAILED (-2)

// ---- WiFi modes ----
#define WIFI_OFF 0
#define WIFI_STA 1
#define WIFI_AP 2
#define WIFI_AP_STA 3

class WiFiClass
{
 public:
  void mode(uint8_t) {}
  wl_status_t status() { return WL_DISCONNECTED; }
  void begin(const char*, const char* = nullptr) {}
  void disconnect(bool = false, bool = false) {}
  void persistent(bool) {}
  IPAddress localIP() { return IPAddress(); }
  IPAddress softAPIP() { return IPAddress(); }
  void softAP(const char*) {}
  void softAPConfig(IPAddress, IPAddress, IPAddress) {}
  void softAPdisconnect(bool = false) {}
  int scanNetworks(bool = false) { return 0; }
  int16_t scanComplete() { return WIFI_SCAN_FAILED; }
  void scanDelete() {}
  String SSID(uint8_t) { return ""; }
  int32_t RSSI(uint8_t) { return 0; }
  int32_t channel(uint8_t) { return 0; }
  wifi_auth_mode_t encryptionType(uint8_t) { return WIFI_AUTH_OPEN; }
  String macAddress() { return "AA:BB:CC:DD:EE:FF"; }
};

inline WiFiClass WiFi;
