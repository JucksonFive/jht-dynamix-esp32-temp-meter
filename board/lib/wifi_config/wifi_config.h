#pragma  once
#include <Arduino.h>

struct WifiConfig {
    String ssid;
    String password;
    String deviceId;
};

namespace WifiConfigManager {
    bool load(WifiConfig& config);
    bool save(const WifiConfig& config);
    void clear(); 
}