#pragma once
#include <map>
#include <string>
#include "Arduino.h"
#include "Stream.h"

class MockFileSystem;  // forward declaration

class File : public Stream
{
  std::string _content;
  size_t _readPos = 0;
  bool _isOpen = false;
  bool _isWrite = false;
  std::string _path;
  MockFileSystem* _fs = nullptr;

 public:
  File() = default;
  File(const std::string& content, bool isWrite, const std::string& path, MockFileSystem* fs)
      : _content(isWrite ? "" : content), _readPos(0), _isOpen(true), _isWrite(isWrite), _path(path), _fs(fs)
  {
  }

  operator bool() const { return _isOpen; }

  // Print interface (write to file)
  size_t write(uint8_t c) override
  {
    if (_isWrite)
    {
      _content.push_back(static_cast<char>(c));
      return 1;
    }
    return 0;
  }

  size_t write(const uint8_t* buf, size_t sz) override
  {
    if (_isWrite)
    {
      _content.append(reinterpret_cast<const char*>(buf), sz);
      return sz;
    }
    return 0;
  }

  // Stream interface (read from file)
  int available() override { return _isOpen ? static_cast<int>(_content.size() - _readPos) : 0; }

  int read() override
  {
    if (_isOpen && _readPos < _content.size())
      return static_cast<uint8_t>(_content[_readPos++]);
    return -1;
  }

  int peek() override
  {
    if (_isOpen && _readPos < _content.size())
      return static_cast<uint8_t>(_content[_readPos]);
    return -1;
  }

  // File-specific methods
  size_t size() { return _content.size(); }
  void close();

  size_t print(const char* s)
  {
    if (!s)
      return 0;
    return write(reinterpret_cast<const uint8_t*>(s), strlen(s));
  }

  size_t print(const String& s) { return print(s.c_str()); }

  String readString()
  {
    String result;
    while (available() > 0)
    {
      result += static_cast<char>(read());
    }
    return result;
  }
};

class MockFileSystem
{
  std::map<std::string, std::string> _files;

 public:
  bool begin(bool = false) { return true; }

  File open(const char* path, const char* mode = "r")
  {
    std::string p(path);
    if (mode[0] == 'w')
    {
      _files[p] = "";
      return File("", true, p, this);
    }
    auto it = _files.find(p);
    if (it == _files.end())
      return File();
    return File(it->second, false, p, this);
  }

  File open(const String& path, const char* mode = "r") { return open(path.c_str(), mode); }

  bool exists(const char* path) { return _files.count(path) > 0; }
  bool exists(const String& path) { return exists(path.c_str()); }

  bool remove(const char* path) { return _files.erase(path) > 0; }
  bool remove(const String& path) { return remove(path.c_str()); }

  void commitFile(const std::string& path, const std::string& content) { _files[path] = content; }

  void clear() { _files.clear(); }

  // Test helper: pre-populate a file
  void setFile(const std::string& path, const std::string& content) { _files[path] = content; }

  // Test helper: read file content directly
  std::string getFileContent(const std::string& path)
  {
    auto it = _files.find(path);
    return it != _files.end() ? it->second : "";
  }
};

// File::close implementation (needs MockFileSystem to be complete)
inline void File::close()
{
  if (_isOpen && _isWrite && _fs)
  {
    _fs->commitFile(_path, _content);
  }
  _isOpen = false;
}
