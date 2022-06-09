/**
 * This code was generated by a tool.
 * @basketry/typescript@{{version}}
 *
 * Changes to this file may cause incorrect behavior and will be lost if
 * the code is regenerated.
 */

export interface GizmoService {
  /**
   * Only has a summary
   */
  getGizmos(params?: { search?: string }): Promise<GizmosResponse>;

  /**
   * Has a summary in addition to a description
   * Has a description in addition to a summary
   */
  createGizmo(params?: {
    /**
     * Anonymous enum
     */
    size?: CreateGizmoSize;
  }): Promise<Gizmo>;

  updateGizmo(params?: {
    /**
     * array of primitive
     */
    factors?: string[];
  }): Promise<Gizmo>;
}

export interface WidgetService {
  getWidgets(): Promise<Widget>;

  createWidget(params?: {
    /**
     * The new widget
     */
    body?: CreateWidgetBody;
  }): Promise<void>;

  putWidget(): Promise<void>;

  getWidgetFoo(params: {
    /**
     * The widget ID
     */
    id: string;
  }): Promise<Widget>;

  deleteWidgetFoo(params: {
    /**
     * The widget ID
     */
    id: string;
  }): Promise<void>;
}

export interface ExhaustiveService {
  exhaustiveFormats(params?: {
    stringNoFormat?: string;
    stringDate?: Date;
    stringDateTime?: Date;
    integerNoFormat?: number;
    integerInt32?: number;
    integerInt64?: number;
    numberNoFormat?: number;
    numberFloat?: number;
    numberDouble?: number;
  }): Promise<void>;

  exhaustiveParams(params: {
    pathString: string;
    pathEnum: ExhaustiveParamsPathEnum;
    pathNumber: number;
    pathInteger: number;
    pathBoolean: boolean;
    pathStringArray: string[];
    pathEnumArray: ExhaustiveParamsPathEnumArray[];
    pathNumberArray: number[];
    pathIntegerArray: number[];
    pathBooleanArray: boolean[];
    queryString?: string;
    queryEnum?: ExhaustiveParamsQueryEnum;
    queryNumber?: number;
    queryInteger?: number;
    queryBoolean?: boolean;
    queryStringArray?: string[];
    queryEnumArray?: ExhaustiveParamsQueryEnumArray[];
    queryNumberArray?: number[];
    queryIntegerArray?: number[];
    queryBooleanArray?: boolean[];
    headerString?: string;
    headerEnum?: ExhaustiveParamsHeaderEnum;
    headerNumber?: number;
    headerInteger?: number;
    headerBoolean?: boolean;
    headerStringArray?: string[];
    headerEnumArray?: ExhaustiveParamsHeaderEnumArray[];
    headerNumberArray?: number[];
    headerIntegerArray?: number[];
    headerBooleanArray?: boolean[];
    body?: ExhaustiveParamsBody;
  }): Promise<void>;
}

export interface AuthPermutationService {
  allAuthSchemes(): Promise<void>;

  comboAuthSchemes(): Promise<void>;
}

export type CreateGizmoSize = 'small' | 'medium' | 'big' | 'XL';

export type ExhaustiveParamsQueryEnum = 'one' | 'two' | 'three';

export type ExhaustiveParamsQueryEnumArray = 'one' | 'two' | 'three';

export type ExhaustiveParamsPathEnum = 'one' | 'two' | 'three';

export type ExhaustiveParamsPathEnumArray = 'one' | 'two' | 'three';

export type ExhaustiveParamsHeaderEnum = 'one' | 'two' | 'three';

export type ExhaustiveParamsHeaderEnumArray = 'one' | 'two' | 'three';

export type ProductSize = 'small' | 'medium' | 'large';

export type Gizmo = {
  id?: string;
  name?: string;
  size?: ProductSize;
};

export type Widget = {
  id: string;
  name?: string;
  fiz: number;
  buzz?: number;
  fizbuzz?: number;
  foo?: WidgetFoo;
  size?: ProductSize;
};

export type NewWidget = {
  name?: string;
  fiz: number;
  buzz?: number;
  fizbuzz?: number;
  foo?: NewWidgetFoo;
  size?: ProductSize;
};

export type GizmosResponse = {
  data: Gizmo[];
};

export type CreateWidgetBody = {
  name: string;
};

export type ExhaustiveParamsBody = {
  foo?: string;
  bar?: string;
};

export type WidgetFoo = {
  fiz?: number;
  buzz: number;
};

export type NewWidgetFoo = {
  fiz?: number;
  buzz: number;
};

export type ExampleUnion = Gizmo | string[];
