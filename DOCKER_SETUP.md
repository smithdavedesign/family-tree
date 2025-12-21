# Nominatim Geocoding Service - Local Development Setup

This Docker Compose file sets up a **self-hosted geocoding service** using Nominatim for local development. In production, the app automatically switches to Google Maps API.

## Quick Start

```bash
# 1. Start the Nominatim container
docker-compose up -d

# 2. Monitor import progress (wait for "Ready" message)
docker logs -f nominatim

# 3. Test the service
curl "http://localhost:8080/search?q=Monaco&format=json"
```

## Changing Geographic Region

Edit `docker-compose.yml` and uncomment the desired `PBF_URL`:

*   **Monaco** (Tiny, for testing) ~50MB RAM - Already configured
*   **US Northeast** (Medium) ~4GB RAM  
*  **North America** (Large) ~16GB+ RAM, 100GB+ Disk

After changing the URL:

```bash
# Stop and remove old data
docker-compose down -v

# Start fresh with new region
docker-compose up -d
```

## Resource Requirements

| Region | RAM | Disk | Import Time |
|--------|-----|------|-------------|
| Monaco | 50MB | 200MB | ~2 minutes |
| Single US State | 2-4GB | 10-20GB | ~1 hour |
| North America | 32GB | 100GB | ~10 hours |

## Troubleshooting

**Import stuck?**
```bash
# Check logs
docker logs nominatim

# Ensure Docker has enough memory in Settings > Resources
```

**Port conflict?**
Change `8080:8080` to `8081:8080` in the compose file.

## Production Deployment

**Do NOT deploy this Docker container to production.** Instead:
1. Set `VITE_GOOGLE_MAPS_API_KEY` in your build environment
2. The app will automatically use Google Maps API
3. Docker setup is only for free local development
