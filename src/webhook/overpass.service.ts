import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Attraction } from './interfaces/attraction.interface';

interface CacheEntry {
  data: Attraction[];
  timestamp: number;
}

interface Cache {
  [key: string]: CacheEntry;
}

@Injectable()
export class OverpassService {
  private readonly baseUrl = 'https://overpass-api.de/api/interpreter';
  private readonly defaultRadius = 500; // meters
  private readonly cacheDuration = 3600000; // 1 hour in milliseconds
  private cache: Cache = {};

  private generateCacheKey(lat: number, lng: number, radius: number): string {
    // Round coordinates to 4 decimal places to group nearby searches
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    return `${roundedLat},${roundedLng},${radius}`;
  }

  private getCachedData(key: string): Attraction[] | null {
    const cached = this.cache[key];
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheDuration) {
      // Cache expired
      delete this.cache[key];
      return null;
    }

    return cached.data;
  }

  private setCachedData(key: string, data: Attraction[]): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
    };
  }

  async findNearbyAttractions(lat: number, lng: number, radius: number = this.defaultRadius): Promise<Attraction[]> {
    const cacheKey = this.generateCacheKey(lat, lng, radius);
    const cachedData = this.getCachedData(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached data for coordinates:', { lat, lng, radius });
      return cachedData;
    }

    try {
      const query = `[out:json];
(
  way["tourism"="attraction"](around:${radius},${lat},${lng});
  relation["tourism"="attraction"](around:${radius},${lat},${lng});
);
out center;
out tags;`;

      const response = await axios.post(this.baseUrl, query, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      console.log('Fetching fresh data for coordinates:', { lat, lng, radius });
      const attractions = this.processOverpassResponse(lat, lng, response.data);
      this.setCachedData(cacheKey, attractions);
      
      return attractions;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to fetch nearby attractions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private processOverpassResponse(lat: number, lng: number, data: any): Attraction[] {
    const attractions: Attraction[] = [];

    if (data.elements) {
      for (const element of data.elements) {
        if (element.tags && element.tags.tourism === 'attraction') {
          attractions.push({
            searchLat: lat,
            searchLng: lng,
            id: element.id,
            type: element.type,
            name: element.tags.name || 'Unnamed attraction',
            description: element.tags.description || '',
          });
        }
      }
    }

    return attractions;
  }
}