
import { Object as FabricObject, Canvas, Image, TPointerEvent, TEvent } from 'fabric';

declare module 'fabric' {
  interface Object {
    elementId?: string;
  }
  
  namespace Image {
    namespace filters {
      class Invert extends BaseFilter<string, Record<string, any>, Record<string, any>> {
        constructor();
        type: string;
        getFragmentSource(): string;
        getVertexSource(): string;
        createProgram(gl: WebGLRenderingContext): WebGLProgram;
        applyTo2d(options: any): void;
        applyToWebGL(options: any): void;
        apply(options: any, filterBackend: any): void;
        
        // BaseFilter properties
        getAttributeLocations(gl: WebGLRenderingContext, program: WebGLProgram): Record<string, number>;
        getUniformLocations(gl: WebGLRenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation>;
        sendAttributeData(gl: WebGLRenderingContext, attributeLocations: Record<string, number>, aPositionData: Float32Array): void;
        _setupFrameBuffer(options: any): void;
        _swapTextures(options: any): void;
        isNeutralState(options?: any): boolean;
        applyTo(options: any): void;
        getCacheKey(): string;
        getMainParameter(): any;
        createHelpLayer(options: any): void;
        toObject(): Record<string, any>;
        toJSON(): Record<string, any>;
        
        // Additional properties
        retrieveShader(options: any): WebGLShader;
        bindAdditionalTexture(gl: WebGLRenderingContext, texture: WebGLTexture, textureUnit: number): void;
        unbindAdditionalTexture(gl: WebGLRenderingContext, textureUnit: number): void;
        sendUniformData(gl: WebGLRenderingContext, uniformLocations: Record<string, WebGLUniformLocation>): void;
      }
    }
  }
  
  interface Canvas {
    getActiveObject(): FabricObject & { elementId?: string };
  }
  
  // Add event types
  interface SelectionEvent {
    selected: FabricObject[];
    target: FabricObject;
  }
  
  interface ModifiedEvent {
    target: FabricObject;
  }
}
