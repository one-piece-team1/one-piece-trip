import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MultiLineString, Position } from 'geojson';
import { APIRequestFactory } from '../libs/request-factory';
import { SearchForPlanStartandEndPointDto } from './dtos';
import * as ITrip from '../interfaces';
import { config } from '../../config';

@Injectable()
export class RoutePlanProvider {
  private readonly routePlanUrl: string = `${config.MS_SETTINGS.ONE_PIECE_LOCATION.protocol}://${config.MS_SETTINGS.ONE_PIECE_LOCATION.host}:${config.MS_SETTINGS.ONE_PIECE_LOCATION.port}`;
  private readonly logger: Logger = new Logger('RoutePlanProvider');

  /**
   * @description Get route planning with provided start and end locaiton name
   * - Route plan has two return type, with type 'text' it returns the collections of the plans finded by DIJKSTRA
   * - with type 'LINE' it returns a Spatil System Srid 4326 Hash string to represent the planning
   * @public
   * @param searchForPlanStartandEndPointDto
   * @param serviceToken
   * @returns {Promise<MultiLineString>}
   */
  public async getRoutePlanning(searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto, serviceToken: string): Promise<MultiLineString> {
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
      this.logger.error(error.message, '', 'GetRoutePlanningError');
      throw new InternalServerErrorException(error.message);
    }
  }

  public convertToMultiLineString(plans: ITrip.INetworkGeometryResponse[]): MultiLineString {
    const coordinates: Position[][] = [];
    plans.forEach((plan: ITrip.INetworkGeometryResponse) => coordinates.push(plan.lineString.coordinates));
    return {
      type: 'MultiLineString',
      coordinates,
    };
  }
}
