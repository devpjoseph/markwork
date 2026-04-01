export type CommentStatus = 'OPEN' | 'RESOLVED' | 'REJECTED'

export interface Comment {
  id: string
  assignment_id: string
  author_id: string
  tiptap_node_id: string
  selected_text: string
  content: string
  status: CommentStatus
  created_at: string
  parent_id: string | null
}
