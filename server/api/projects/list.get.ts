import {createDirectus, readItems, rest, staticToken} from "@directus/sdk";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const client = createDirectus(config.directusUrl || config.public.directusUrl).with(staticToken(config.directusToken)).with(rest());

    const projects = await client.request(readItems('projects', {
        fields: ['*'],
    }))

    return projects;

});
