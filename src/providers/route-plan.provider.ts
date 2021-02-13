import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { APIRequestFactory } from '../libs/request-factory';
import { SearchForPlanStartandEndPointDto } from './dtos';
import { config } from '../../config';
import * as ITrip from '../interfaces';
import { MultiLineString, Position } from 'geojson';

@Injectable()
export class RoutePlanProvider {
  private readonly routePlanUrl: string = `${config.MS_SETTINGS.ONE_PIECE_LOCATION.protocol}://${config.MS_SETTINGS.ONE_PIECE_LOCATION.host}:${config.MS_SETTINGS.ONE_PIECE_LOCATION.port}`;
  private readonly logger: Logger = new Logger('RoutePlanProvider');

  async getRoutePlanning(searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto, serviceToken: string): Promise<MultiLineString> {
    console.log('searchForPlanStartandEndPointDto: ', searchForPlanStartandEndPointDto);
    try {
      const routePlan = (await APIRequestFactory.createRequest('standard').makeRequest({
        method: 'GET',
        url: `${this.routePlanUrl}/turns/plans/generates?startLocationName=${searchForPlanStartandEndPointDto.startLocationName}&endLocationName=${searchForPlanStartandEndPointDto.endLocationName}&type=${searchForPlanStartandEndPointDto.type}`,
        json: true,
        headers: {
          Authorization: serviceToken,
        },
        timeout: 3000,
      })) as ITrip.ResponseBase;

      if (routePlan.status !== 'success')
        return {
          type: 'MultiLineString',
          coordinates: [],
        };
      return this.convertToMultiLineString(routePlan.message as ITrip.INetworkGeometryResponse[]);
    } catch (error) {
      this.logger.log(error.message, 'GetRoutePlanningError');
      throw new InternalServerErrorException(error.message);
    }
  }

  convertToMultiLineString(plans: ITrip.INetworkGeometryResponse[]): MultiLineString {
    const coordinates: Position[][] = [];
    plans.forEach((plan: ITrip.INetworkGeometryResponse) => coordinates.push(plan.lineString.coordinates));
    return {
      type: 'MultiLineString',
      coordinates,
    };
  }
}
