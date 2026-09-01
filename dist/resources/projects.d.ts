import type { Transport } from '../transport.js';
import type { LogoInput, MutationOptions, Page, Project, ProjectCreateAccepted, ProjectCreateInput, ProjectListOptions, ProjectUpdateInput, RequestOptions, WaitOptions } from '../types/index.js';
export declare class ProjectsResource {
    private readonly transport;
    constructor(transport: Transport);
    create(input: ProjectCreateInput, options?: MutationOptions): Promise<ProjectCreateAccepted>;
    list(options?: ProjectListOptions, requestOptions?: RequestOptions): Promise<Page<Project>>;
    get(projectId: string, options?: RequestOptions): Promise<Project>;
    wait(projectId: string, options?: WaitOptions): Promise<Project>;
    update(projectId: string, patch: ProjectUpdateInput, options?: MutationOptions): Promise<Project>;
    refresh(projectId: string, options?: MutationOptions): Promise<Project>;
    archive(projectId: string, options?: RequestOptions): Promise<Project>;
    setLogo(projectId: string, input: LogoInput, options?: MutationOptions): Promise<Project>;
    deleteLogo(projectId: string, options?: RequestOptions): Promise<Project>;
}
//# sourceMappingURL=projects.d.ts.map