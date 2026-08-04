export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.15'
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          project_id: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          project_id?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          project_id?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activity_logs_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_logs_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      board_columns: {
        Row: {
          board_id: string
          created_at: string
          id: string
          is_terminal: boolean
          name: string
          position: number
          status_type: Database['public']['Enums']['task_status_type']
          updated_at: string
          wip_limit: number | null
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          is_terminal?: boolean
          name: string
          position: number
          status_type: Database['public']['Enums']['task_status_type']
          updated_at?: string
          wip_limit?: number | null
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          is_terminal?: boolean
          name?: string
          position?: number
          status_type?: Database['public']['Enums']['task_status_type']
          updated_at?: string
          wip_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'board_columns_board_id_fkey'
            columns: ['board_id']
            isOneToOne: false
            referencedRelation: 'boards'
            referencedColumns: ['id']
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'boards_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'boards_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          id: string
          project_id: string
          starts_at: string
          title: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          id?: string
          project_id: string
          starts_at: string
          title: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          project_id?: string
          starts_at?: string
          title?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'calendar_events_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'calendar_events_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'calendar_events_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          deleted_at: string | null
          file_type: Database['public']['Enums']['file_type']
          id: string
          mime_type: string
          name: string
          project_id: string
          size_bytes: number
          storage_key: string
          task_id: string | null
          updated_at: string
          uploaded_by: string
          version_number: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          file_type?: Database['public']['Enums']['file_type']
          id?: string
          mime_type: string
          name: string
          project_id: string
          size_bytes: number
          storage_key: string
          task_id?: string | null
          updated_at?: string
          uploaded_by: string
          version_number?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          file_type?: Database['public']['Enums']['file_type']
          id?: string
          mime_type?: string
          name?: string
          project_id?: string
          size_bytes?: number
          storage_key?: string
          task_id?: string | null
          updated_at?: string
          uploaded_by?: string
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'files_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'files_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'files_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'files_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      labels: {
        Row: {
          color_token: string
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color_token: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color_token?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'labels_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'labels_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      notification_preferences: {
        Row: {
          assigned_task: boolean
          browser_enabled: boolean
          created_at: string
          due_today: boolean
          email_enabled: boolean
          in_app_enabled: boolean
          mention: boolean
          overdue: boolean
          review_requested: boolean
          task_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_task?: boolean
          browser_enabled?: boolean
          created_at?: string
          due_today?: boolean
          email_enabled?: boolean
          in_app_enabled?: boolean
          mention?: boolean
          overdue?: boolean
          review_requested?: boolean
          task_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_task?: boolean
          browser_enabled?: boolean
          created_at?: string
          due_today?: boolean
          email_enabled?: boolean
          in_app_enabled?: boolean
          mention?: boolean
          overdue?: boolean
          review_requested?: boolean
          task_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      project_members: {
        Row: {
          added_by: string
          created_at: string
          id: string
          joined_at: string
          project_id: string
          role: Database['public']['Enums']['project_member_role']
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          joined_at?: string
          project_id: string
          role: Database['public']['Enums']['project_member_role']
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          joined_at?: string
          project_id?: string
          role?: Database['public']['Enums']['project_member_role']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_members_added_by_fkey'
            columns: ['added_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      project_templates: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_templates_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_templates_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_favourite: boolean
          name: string
          owner_id: string
          priority: Database['public']['Enums']['task_priority']
          progress_percentage: number
          project_code: string
          start_date: string | null
          status: Database['public']['Enums']['project_status']
          template_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_favourite?: boolean
          name: string
          owner_id: string
          priority?: Database['public']['Enums']['task_priority']
          progress_percentage?: number
          project_code?: string
          start_date?: string | null
          status?: Database['public']['Enums']['project_status']
          template_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_favourite?: boolean
          name?: string
          owner_id?: string
          priority?: Database['public']['Enums']['task_priority']
          progress_percentage?: number
          project_code?: string
          start_date?: string | null
          status?: Database['public']['Enums']['project_status']
          template_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projects_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projects_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_edited: boolean
          parent_comment_id: string | null
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_edited?: boolean
          parent_comment_id?: string | null
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_edited?: boolean
          parent_comment_id?: string | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_comments_parent_comment_id_fkey'
            columns: ['parent_comment_id']
            isOneToOne: false
            referencedRelation: 'task_comments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_comments_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      task_labels: {
        Row: {
          created_at: string
          label_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          label_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          label_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_labels_label_id_fkey'
            columns: ['label_id']
            isOneToOne: false
            referencedRelation: 'labels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_labels_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      task_watchers: {
        Row: {
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_watchers_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_watchers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          blocked_reason: string | null
          board_id: string
          column_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          is_blocked: boolean
          parent_task_id: string | null
          position: number
          priority: Database['public']['Enums']['task_priority']
          progress_percentage: number
          project_id: string
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          blocked_reason?: string | null
          board_id: string
          column_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          is_blocked?: boolean
          parent_task_id?: string | null
          position: number
          priority?: Database['public']['Enums']['task_priority']
          progress_percentage?: number
          project_id: string
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          blocked_reason?: string | null
          board_id?: string
          column_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          is_blocked?: boolean
          parent_task_id?: string | null
          position?: number
          priority?: Database['public']['Enums']['task_priority']
          progress_percentage?: number
          project_id?: string
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_board_id_fkey'
            columns: ['board_id']
            isOneToOne: false
            referencedRelation: 'boards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_column_id_fkey'
            columns: ['column_id']
            isOneToOne: false
            referencedRelation: 'board_columns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_parent_task_id_fkey'
            columns: ['parent_task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          default_task_priority: Database['public']['Enums']['task_priority']
          default_task_status: Database['public']['Enums']['task_status_type']
          show_completed_tasks: boolean
          updated_at: string
          user_id: string
          week_starts_on: number
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          created_at?: string
          default_task_priority?: Database['public']['Enums']['task_priority']
          default_task_status?: Database['public']['Enums']['task_status_type']
          show_completed_tasks?: boolean
          updated_at?: string
          user_id: string
          week_starts_on?: number
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          created_at?: string
          default_task_priority?: Database['public']['Enums']['task_priority']
          default_task_status?: Database['public']['Enums']['task_status_type']
          show_completed_tasks?: boolean
          updated_at?: string
          user_id?: string
          week_starts_on?: number
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          department: string | null
          display_name: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          job_title: string | null
          last_name: string
          last_seen_at: string | null
          locale: string
          phone_number: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          display_name: string
          email: string
          first_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_name?: string
          last_seen_at?: string | null
          locale?: string
          phone_number?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          display_name?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_name?: string
          last_seen_at?: string | null
          locale?: string
          phone_number?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_integrations: {
        Row: {
          connected_at: string
          connected_by: string
          id: string
          is_connected: boolean
          provider: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          connected_at?: string
          connected_by: string
          id?: string
          is_connected?: boolean
          provider: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          connected_at?: string
          connected_by?: string
          id?: string
          is_connected?: boolean
          provider?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workspace_integrations_connected_by_fkey'
            columns: ['connected_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workspace_integrations_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          role: Database['public']['Enums']['workspace_role']
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role: Database['public']['Enums']['workspace_role']
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role?: Database['public']['Enums']['workspace_role']
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workspace_members_invited_by_fkey'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workspace_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string | null
          date_format: string
          deleted_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          time_format: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_format?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          time_format?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_format?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          time_format?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workspaces_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_workspace_member_by_email: {
        Args: {
          p_email: string
          p_role?: Database['public']['Enums']['workspace_role']
          p_workspace_id: string
        }
        Returns: undefined
      }
      create_project_with_owner: {
        Args: {
          p_description: string
          p_due_date: string
          p_member_ids: string[]
          p_name: string
          p_owner_id: string
          p_priority: Database['public']['Enums']['task_priority']
          p_start_date: string
          p_status: Database['public']['Enums']['project_status']
          p_template_id?: string
          p_workspace_id: string
        }
        Returns: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_favourite: boolean
          name: string
          owner_id: string
          priority: Database['public']['Enums']['task_priority']
          progress_percentage: number
          project_code: string
          start_date: string | null
          status: Database['public']['Enums']['project_status']
          template_id: string | null
          updated_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: '*'
          to: 'projects'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_workspace_admin: {
        Args: { target_auth_user_id: string; target_workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { target_auth_user_id: string; target_workspace_id: string }
        Returns: boolean
      }
      reassign_project_owner: {
        Args: { p_new_owner_user_id: string; p_project_id: string }
        Returns: undefined
      }
      refresh_my_task_notifications: { Args: never; Returns: undefined }
      shares_workspace_with: {
        Args: { target_auth_user_id: string; target_user_row_id: string }
        Returns: boolean
      }
    }
    Enums: {
      file_type:
        | 'folder'
        | 'document'
        | 'image'
        | 'spreadsheet'
        | 'presentation'
        | 'pdf'
        | 'archive'
        | 'other'
      project_member_role: 'project_owner' | 'project_manager' | 'contributor' | 'viewer'
      project_status: 'not_started' | 'active' | 'on_hold' | 'completed' | 'archived'
      task_priority: 'low' | 'medium' | 'high' | 'urgent'
      task_status_type: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
      workspace_role: 'owner' | 'admin' | 'member' | 'viewer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      file_type: [
        'folder',
        'document',
        'image',
        'spreadsheet',
        'presentation',
        'pdf',
        'archive',
        'other',
      ],
      project_member_role: ['project_owner', 'project_manager', 'contributor', 'viewer'],
      project_status: ['not_started', 'active', 'on_hold', 'completed', 'archived'],
      task_priority: ['low', 'medium', 'high', 'urgent'],
      task_status_type: ['backlog', 'todo', 'in_progress', 'review', 'done'],
      workspace_role: ['owner', 'admin', 'member', 'viewer'],
    },
  },
} as const
