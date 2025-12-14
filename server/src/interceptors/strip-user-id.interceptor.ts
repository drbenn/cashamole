// common/interceptors/strip-user-id.interceptor.ts

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class StripUserIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    
    // The 'map' operator intercepts the data stream being sent back to the client
    return next.handle().pipe(
      map(data => {
        if (!data) {
          return data;
        }

        // Check if the data is a single object or an array of objects
        const stripUserId = (item: any) => {
          if (item && item.user_id) {
            // Destructuring to strip the user_id field
            const { user_id, ...cleaned } = item;
            return cleaned;
          }
          return item;
        };

        if (Array.isArray(data)) {
          // If it's an array of transactions/snapshots, map over them
          return data.map(stripUserId);
        }

        // If it's a single object
        return stripUserId(data);
      }),
    );
  }
}