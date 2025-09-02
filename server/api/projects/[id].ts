import {createDirectus, readItems, rest, staticToken} from "@directus/sdk";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const client = createDirectus(config.directusUrl || config.public.directusUrl).with(staticToken(config.directusToken)).with(rest());
    const id = event.context.params ? parseInt(event.context.params.id) as number : NaN

    const projects = await client.request(readItems('projects', {
        fields: ['*'],
        filter:
            {
                "id": {
                    "_eq": id
                }
            }
    }))
    return projects[0] || null;
});
