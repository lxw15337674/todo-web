

    ok: number;
    data: {
        cards?: Array<{
            card_type: string;
            mblog?: {
                id: string;
                created_at: string;
                pics?: Array<{
                    large?: {
                        url: string;
                        geo: {
                            width: number;
                            height: number;
                        }
                    }
                }>;
                page_info?: {
                    type: string;
                    media_info?: {
                        stream_url_hd?: string;
                        stream_url?: string;
                    }
                }
            }
        }>;
        pageInfo: {
            since_id: string;
        }
    }
}
