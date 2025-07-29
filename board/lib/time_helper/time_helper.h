#pragma once

namespace TimeHelper
{
    void setup();
    const char *getLocalTimestamp();
    void scheduleRestart(unsigned long delayMs = 0);
}
