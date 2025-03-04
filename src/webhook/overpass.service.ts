import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Attraction } from './interfaces/attraction.interface';

@Injectable()
export class OverpassService {
  private readonly baseUrl = 'https://overpass-api.de/api/interpreter';
  private readonly defaultRadius = 500; // meters

  async findNearbyAttractions(lat: number, lng: number, radius: number = this.defaultRadius): Promise<Attraction[]> {
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

      console.log('DATA', response.data);
      return this.processOverpassResponse(response.data);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to fetch nearby attractions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private processOverpassResponse(data: any): Attraction[] {
    const attractions: Attraction[] = [];

    if (data.elements) {
      for (const element of data.elements) {
        if (element.tags && element.tags.tourism === 'attraction') {
          attractions.push({
            id: element.id,
            type: element.type,
            name: element.tags.name || 'Unnamed attraction',
            description: element.tags.description || '',
            lat: element.lat,
            lng: element.lon,
            distance: this.calculateDistance(
              element.lat,
              element.lon,
              data.elements[0].lat,
              data.elements[0].lon
            ),
          });
        }
      }
    }

    return attractions;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Distance in meters
  }
} 