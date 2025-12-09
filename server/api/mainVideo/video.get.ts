import {createDirectus, readItems, rest, staticToken} from "@directus/sdk";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const client = createDirectus(config.directusUrl || config.public.directusUrl).with(staticToken(config.directusToken)).with(rest());

    const video = await client.request(readItems('main_video', {
        fields: ['video'],
        filter: {
            "status": {
                "_eq": "published"
            }
        }
    }))

    return video[0];

});
