import { LineString } from 'geojson';

export interface INetworkGeometryMakeLine {
  geom?: string;
}
export interface INetworkGeometryAsText {
  id?: string;
  name?: string;
  geom?: string;
  srid?: string;
  length?: number;
  fromnode?: number;
  tonode?: number;
  createdAt?: string;
  updatedAt?: string;
  seq?: string;
  path_seq?: number;
  node?: string;
  edge?: string;
  cost?: number;
  agg_cost?: number;
  route_length?: number;
}

export interface INetworkGeometryResponse extends INetworkGeometryAsText, INetworkGeometryMakeLine {
  l_str?: string;
  lineString?: LineString;
}

export interface INodeGeometryResponse {
  st_distance: number;
  id: number;
  fromnode: number;
  tonode: number;
  geometries: string;
}

export interface INearestNodeQueryResponse {
  startNode?: INodeGeometryResponse;
  endNode?: INodeGeometryResponse;
}

export interface INetworkGeometryRequest {
  startNode: number;
  endNode: number;
}
