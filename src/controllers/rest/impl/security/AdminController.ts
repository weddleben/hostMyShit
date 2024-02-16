import {Delete, Get, Hidden, Post, Required} from "@tsed/schema";
import {Controller, Inject} from "@tsed/di";
import {AdminService} from "../../../../services/AdminService.js";
import {Authorize} from "@tsed/passport";
import {BodyParams} from "@tsed/platform-params";
import {PlatformResponse, QueryParams, Res} from "@tsed/common";
import {NotFound} from "@tsed/exceptions";
import {BaseRestController} from "../../BaseRestController.js";
import {DatatableColumn, DatatableOrder, DatatableSearch} from "../../../../utils/typeings.js";
import {StatusCodes} from "http-status-codes";


@Hidden()
@Controller("/admin")
export class AdminController extends BaseRestController {

    public constructor(
        @Inject() private adminService: AdminService
    ) {
        super();
    }

    @Authorize("loginAuthProvider")
    @Get("/allEntries")
    public getAllEntries(): Promise<unknown> {
        return this.adminService.getAllEntries();
    }

    @Authorize("loginAuthProvider")
    @Get("/datatablesEntries")
    public async getDatatablesEntries(@QueryParams("draw") draw: number,
                                      @QueryParams("start") start: number,
                                      @QueryParams("length") length: number,
                                      @QueryParams("order") order: DatatableOrder[],
                                      @QueryParams("columns") columns: DatatableColumn[],
                                      @QueryParams("search") search: DatatableSearch
    ): Promise<unknown> {
        let sortColumn;
        let sortOrder;
        const searchVal = search ? search.value : undefined;
        if (order && columns) {
            sortOrder = order[0]?.dir.toUpperCase();
            sortColumn = columns[order[0]?.column ?? 0]?.data;
        }
        const data = await this.adminService.getPagedEntries(start, length, sortColumn, sortOrder, searchVal);
        const records = searchVal ? await this.adminService.getFileSearchRecordCount(search.value) : await this.adminService.getFileRecordCount();
        return {
            "draw": draw,
            "recordsTotal": records,
            "recordsFiltered": records,
            "data": data
        };
    }

    @Authorize("loginAuthProvider")
    @Get("/blockedIps")
    public getAllBlockedIps(): Promise<unknown> {
        return this.adminService.getAllBlockedIps();
    }

    @Authorize("loginAuthProvider")
    @Post("/blockIp")
    public async blockIp(
        @Res() res: PlatformResponse,
        @QueryParams("removeRelatedData", Boolean) removeRelatedData = false,
        @Required() @BodyParams("ip") ip: string
    ): Promise<unknown> {
        await this.adminService.blockIp(ip, removeRelatedData);
        return super.doSuccess(res, "IP blocked");
    }

    @Authorize("loginAuthProvider")
    @Post("/unblockIps")
    public async unblockIps(
        @Res() res: PlatformResponse,
        @BodyParams() ips: string[]
    ): Promise<unknown> {
        const success = await this.adminService.removeBlockedIps(ips);
        if (!success) {
            return super.doError(res, "Unable to remove selected ips", StatusCodes.INTERNAL_SERVER_ERROR);
        }
        return super.doSuccess(res, "IP un-blocked");
    }

    @Authorize("loginAuthProvider")
    @Delete("/deleteEntries")
    public async deleteEntries(@Res() res: PlatformResponse, @BodyParams() ids: number[]): Promise<unknown> {
        const result = await this.adminService.deleteEntries(ids);
        if (!result) {
            throw new NotFound(`No entry with IDs ${ids.join(", ")} found.`);
        }
        return super.doSuccess(res, `Entries have been deleted.`);
    }

}
