import {Controller, Inject} from "@tsed/di";
import {Delete, Description, Get, Name, Put, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {FileUploadModelResponse} from "../../../model/rest/FileUploadModelResponse.js";
import {BadRequest, Forbidden} from "@tsed/exceptions";
import {MultipartFile, PathParams, type PlatformMulterFile, QueryParams, Req} from "@tsed/common";
import {BodyParams} from "@tsed/platform-params";
import {FileEngine} from "../../../engine/FileEngine.js";
import {FileUploadService} from "../../../services/FileUploadService.js";

@Controller("/")
@Returns(StatusCodes.FORBIDDEN, Forbidden).Description("If your IP has been blocked")
@Description("This is the API documentation for uploading and sharing files.")
@Name("File Uploader")
export class FileUploadController {

    @Inject()
    private fileEngine: FileEngine;

    @Inject()
    private fileUploadService: FileUploadService;

    @Put()
    @Returns(StatusCodes.CREATED, FileUploadModelResponse)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    @Description("Upload a file or specify URL to a file")
    public async addEntry(@Req() req: Req, @MultipartFile("file") file?: PlatformMulterFile, @BodyParams("url") url?: string): Promise<unknown> {
        if (file && url) {
            if (file) {
                await this.fileEngine.deleteFile(file);
            }
            throw new BadRequest("Unable to upload both a file and a url");
        }
        if (!file && !url) {
            throw new BadRequest("Please supply a file or url");
        }
        const ip = req.ip.replace(/:\d+[^:]*$/, '');
        return this.fileUploadService.processUpload(ip, url || file!);
    }


    @Get("/:token")
    @Returns(StatusCodes.OK, FileUploadModelResponse)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    @Description("Get file info")
    public getInfo(
        @PathParams("token")
            token: string,
        @QueryParams("formatted")
        @Description("If true, this will format the time remaining to a human readable string instead of an epoch if set to false")
            humanReadable: boolean): Promise<unknown> {
        if (!token) {
            throw new BadRequest("no token provided");
        }
        return this.fileUploadService.getFileInfo(token, humanReadable);
    }


    @Delete("/:token")
    @Returns(StatusCodes.OK, Boolean)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    @Description("Delete a file via the token")
    public async deleteEntry(@PathParams("token") token: string): Promise<unknown> {
        if (!token) {
            throw new BadRequest("no token provided");
        }
        const deleted = await this.fileUploadService.processDelete(token);
        if (!deleted) {
            throw new BadRequest(`Unknown token ${token}`);
        }
        return deleted;
    }
}
