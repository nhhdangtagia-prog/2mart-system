import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserContext } from '@2mart/domain/src/auth/UserContext';

// Định nghĩa Custom Decorator @RequirePermission
import { SetMetadata } from '@nestjs/common';
export const RequirePermission = (...permissions: string[]) => SetMetadata('permissions', permissions);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // Endpoint không yêu cầu quyền
    }

    const request = context.switchToHttp().getRequest();
    // UserContext được gộp lại từ AuthGuard và BranchContextMiddleware
    const userContext: UserContext = request.userContext; 

    if (!userContext) {
      throw new ForbiddenException('User context not found');
    }

    // Kiểm tra xem UserContext hiện tại có đủ các quyền yêu cầu không
    const hasPermission = requiredPermissions.every(permission => 
      userContext.hasPermission(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException(`You don't have permission to perform this action. Required: ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}
