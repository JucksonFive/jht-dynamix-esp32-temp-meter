#ifndef OFFLINE_SYNC_HELPER_H
#define OFFLINE_SYNC_HELPER_H

#include <Arduino.h>
#include <FS.h>
#include <ArduinoJson.h>

class OfflineSyncHelper
{
private:
    static const char *QUEUE_FILE;
    static const size_t MAX_QUEUE_SIZE = 1000;
    static const size_t MAX_FILE_SIZE = 512000; // 500KB

    bool createQueueFile();
    bool appendToQueue(const JsonDocument &doc);
    bool loadQueue(JsonDocument &doc);
    bool clearQueue();
    size_t getQueueSize();

public:
    bool begin();

    // Lisää tapahtuma jonoon
    bool queueEvent(const char *topic, const char *payload, unsigned long timestamp);

    // Lähetä kaikki jonossa olevat tapahtumat
    bool syncPendingEvents(bool (*sendCallback)(const char *, const char *));

    // Tarkista jonon tila
    bool hasPendingEvents();
    size_t getPendingCount();
};

#endif