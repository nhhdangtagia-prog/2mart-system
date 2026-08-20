import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// Note: In a real implementation, we would inject a service to fetch the User's Default Branch

@Injectable()
export class BranchContextMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Lấy từ Cookie (ưu tiên cao nhất cho Web App)
    let branchId = req.cookies?.['X-Branch-Id'];

    // 2. Lấy từ Header (nếu gọi từ Mobile App, PWA hoặc 3rd party API)
    if (!branchId) {
      branchId = req.headers['x-branch-id'] as string;
    }

    // 3. Fallback lấy Default Branch của User nếu đã đăng nhập
    if (!branchId && req['user']) { // req['user'] được set bởi AuthMiddleware/Guard chạy trước
      branchId = req['user'].defaultBranchId; 
    }

    // 4. Reject nếu không thể xác định Context
    if (!branchId) {
      throw new UnauthorizedException('Branch Context is required. Please provide X-Branch-Id in Cookie or Header.');
    }

    // Gán branchId vào request để đưa vào UserContext sau này
    req['activeBranchId'] = branchId;
    next();
  }
}
