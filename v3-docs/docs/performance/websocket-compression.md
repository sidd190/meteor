# Websocket Compression in Meteor

Meteor's stream server uses the permessage-deflate extension for websocket compression by default. While compression can help reduce bandwidth usage, it may impact performance in reactivity-intensive applications due to the computational overhead of compressing numerous DDP messages.

## Configuration

### Disabling Compression

You can disable websocket compression by setting the `SERVER_WEBSOCKET_COMPRESSION` environment variable to `false`:

```bash
SERVER_WEBSOCKET_COMPRESSION=false
```

### Custom Compression Settings

To customize compression settings, set `SERVER_WEBSOCKET_COMPRESSION` to a JSON string with your desired configuration:

```bash
# Example with custom settings
SERVER_WEBSOCKET_COMPRESSION='{"threshold": 2048, "level": 1}'
```

Available configuration options:

- `threshold`: Minimum message size (in bytes) before compression is applied (default: 1024)
- `level`: Compression level (0-9, where 0=none, 1=fastest, 9=best compression)
- `memLevel`: Memory level (1-9, lower uses less memory)
- `noContextTakeover`: When true, compressor resets for each message (default: true)
- `maxWindowBits`: Window size for compression (9-15, lower uses less memory)

## Verifying Compression Status

You can check if compression is enabled through the Meteor shell:

```javascript
Meteor.server.stream_server.server.options.faye_server_options.extensions
```

Results interpretation:
- `[]` (empty array): Compression is disabled
- `[{}]` (array with object): Compression is enabled

## Performance Considerations

- For apps with high message throughput or frequent small updates, disabling compression may improve performance
- Large message payloads may benefit from compression, especially over slower network connections
- Consider monitoring CPU usage and response times when adjusting compression settings

## Default Configuration

When enabled, the default configuration uses:
- Compression threshold: 1024 bytes
- Compression level: Z_BEST_SPEED (fastest)
- Memory level: Z_MIN_MEMLEVEL (minimum memory usage)
- Context takeover: Disabled
- Window bits: Z_MIN_WINDOWBITS (minimum window size)
