export interface GPTS {
    props: Props
    page: string
    query: Query
    buildId: string
    assetPrefix: string
    isFallback: boolean
    gssp: boolean
    scriptLoader: any[]
}

export interface Props {
    pageProps: PageProps
    __N_SSP: boolean
}

export interface PageProps {
    kind: string
    gizmo: Gizmo
}

export interface Gizmo {
    gizmo: Gizmo2
    tools: Tool[]
    files: any[]
    product_features: ProductFeatures
}

export interface Gizmo2 {
    id: string
    organization_id: string
    short_url: string
    author: Author
    voice: Voice
    workspace_id: any
    model: any
    instructions: any
    settings: any
    display: Display
    share_recipient: string
    updated_at: string
    last_interacted_at: any
    tags: string[]
    version: any
    live_version: any
    training_disabled: any
    allowed_sharing_recipients: any
    review_info: any
    appeal_info: any
    vanity_metrics: any
}

export interface Author {
    user_id: string
    display_name: string
    link_to: any
    selected_display: string
    is_verified: boolean
}

export interface Voice {
    id: string
}

export interface Display {
    name: string
    description: string
    welcome_message: string
    prompt_starters: any
    profile_picture_url: string
    categories: any[]
}

export interface Tool {
    id: string
    type: string
    settings: any
    metadata: any
}

export interface ProductFeatures {
    attachments: Attachments
}

export interface Attachments {
    type: string
    accepted_mime_types: string[]
    image_mime_types: string[]
    can_accept_all_mime_types: boolean
}

export interface Query {
    gizmoId: string
}
