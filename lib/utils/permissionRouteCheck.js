// lib/utils/permissionRouteCheck.js
import "server-only";
import { NextResponse } from "next/server";
import { getSession, getSessionServer } from "@/lib/session";
import {modelAccount} from '@/model/account'; 
import Tbl_permission from '@/lib/Knex/model/tbl_permission';
import Tbl_role_permission from '@/lib/Knex/model/tbl_role_permission';

export async function checkAccountPermission(req, pathname, method) {

  try{

      let session, currentPath, currentMethod, res
    
      if (req && req.nextUrl) {
        currentPath = req.nextUrl.pathname;
        currentMethod = req.method;
        res = NextResponse.next();
        session = await getSession(req, res);
      }
      else {
        session = await getSessionServer();
        currentPath = pathname;
        currentMethod = method;
        res = null;
      }

      if (!session?.user?.userId) throw Object.assign(new Error("ไม่พบข้อมูลการเข้าสู่ระบบ"), { status: 401 });
        
      const whereAccount = [
        { type: 'and', field: 'user_id', operator: '=', value: session.user.userId },
        { type: 'and', field: 'status', operator: '=', value: true },
      ]

      const account = await modelAccount({whereAccount});
      
      if (Array.isArray(account) ? account.length === 0 : !account) throw Object.assign(new Error("ไม่พบข้อมูลการเข้าใช้งาน"), { status: 401 });

      const roleId = account.role_id;

      const permissions = await Tbl_role_permission.query()
      .join('tbl_permission', 'tbl_role_permission.permission_id', 'tbl_permission.permission_id')
      .join('tbl_role', 'tbl_role_permission.role_id', 'tbl_role.role_id')
      .where('tbl_role_permission.role_id', roleId)
      .andWhere('tbl_role_permission.can_access', true)
      .andWhere('tbl_permission.status', true)
      .andWhere('tbl_role.role_status', true)
      .andWhere('tbl_permission.method', currentMethod)
      .select('tbl_permission.route_path');
 
      const hasPermission = permissions.some(perm => routePathToRegex(perm.route_path).test(currentPath));

      if (!hasPermission) throw Object.assign(new Error("ไม่มีสิทธิ์ใช้งาน"), { status: 401 });

      return { session, account, res }

  } catch (err) {

    console.error("checkAccountPermission  error:", err);
    throw err;

  }

}

function routePathToRegex(routePath) {
  const regexStr = '^' + routePath.replace(/:[^/]+/g, '[^/]+') + '$';
  return new RegExp(regexStr);
}
