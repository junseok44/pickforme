// 이벤트 이름 타입 정의
export type AnalyticsEventName =
    | 'button_click'
    | 'question_send'
    | 'login_success'
    | 'login_attempt'
    | 'register_success'
    | 'home_item_click'
    | 'search_item_click'
    | 'search_mode_view'
    | 'search_mode_engagement'
    | 'link_search_attempt'
    | 'link_search_complete'
    | 'link_search_page_view'
    | 'keyword_search_result'
    | 'product_detail_wishlist_toggle'
    | 'product_detail_tab_click'
    | 'product_detail_buy_click'
    | 'subscription_request'
    | 'subscription_request_success'
    | 'subscription_unsubscribe'
    | 'subscription_request_failure'
    | 'main_products_request'
    | 'main_products_response'
    | 'manager_answer_push_click'
    | 'tab_content_process'
    | 'tab_click';

// | 'login'
// | 'signup'
// | 'logout'
// | 'button_click'
// | 'item_view'
// | 'item_select'
// | 'search'
// | 'filter_apply'
// | 'share'
// | 'error_occurred';

// 화면 이름 타입 정의
export type AnalyticsScreenName =
    | 'HomeScreen'
    | 'ProductDetailScreen'
    | 'WishlistScreen'
    | 'MyPageScreen'
    | 'SubscriptionScreen'
    | 'SubscriptionHistoryScreen'
    | 'LoginScreen';

// 이벤트 파라미터 타입 정의
export interface AnalyticsEventParams {
    button_name?: string;
    screen?: string;
    item_id?: string;
    item_name?: string;
    category?: string;
    search_term?: string;
    error_message?: string;
    [key: string]: any;
}
