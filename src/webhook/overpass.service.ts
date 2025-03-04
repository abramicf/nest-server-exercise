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
      return this.processOverpassResponse(lat, lng, response.data);
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