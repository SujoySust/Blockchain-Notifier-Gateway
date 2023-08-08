//
export class ResponseModel {
  success: boolean;
  message?: string;
  messages?: string[];
  data?: object;
  code: number;
}
