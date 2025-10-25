export interface PostLogParams {
  product: {
    url?: string;
    group: string; // bestcategories, goldbox, local, search, link, liked, request
  }
  action: string; // caption, report, review, question, link, like, request
  metaData?: any;
}