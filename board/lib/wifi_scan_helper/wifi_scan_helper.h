#pragma once
#include <Arduino.h>

namespace WifiScanHelper
{
    void beginScan();           // Käynnistää uuden skannauksen
    void processScanResult();   // Kutsutaan loopissa
    bool hasResult();           // Onko valmis tulos?
    String getResultAndClear(); // Palauttaa ja tyhjentää tuloksen
}
