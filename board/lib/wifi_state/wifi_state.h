#pragma once
#include <WiFi.h>

enum class WifiState
{
    Idle,
    Scanning,
    Connecting,
    Connected,
    Failed
};

extern volatile WifiState wifiState;
extern IPAddress staIp;
