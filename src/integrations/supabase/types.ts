export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      absen_share: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          jadwal_id: string
          link: string
          shared_by: string | null
          tanggal: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          jadwal_id: string
          link: string
          shared_by?: string | null
          tanggal: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          jadwal_id?: string
          link?: string
          shared_by?: string | null
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "absen_share_jadwal_id_fkey"
            columns: ["jadwal_id"]
            isOneToOne: false
            referencedRelation: "jadwal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absen_share_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "anggota"
            referencedColumns: ["id"]
          },
        ]
      }
      anggota: {
        Row: {
          created_at: string
          email: string | null
          foto_url: string | null
          hobi: string | null
          id: string
          ig: string | null
          motto: string | null
          nama: string
          nim: string | null
          panggilan: string | null
          role: Database["public"]["Enums"]["anggota_role"]
          tempat_lahir: string | null
          tgl_lahir: string | null
          urutan: number | null
          user_id: string | null
          wa: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          foto_url?: string | null
          hobi?: string | null
          id?: string
          ig?: string | null
          motto?: string | null
          nama: string
          nim?: string | null
          panggilan?: string | null
          role?: Database["public"]["Enums"]["anggota_role"]
          tempat_lahir?: string | null
          tgl_lahir?: string | null
          urutan?: number | null
          user_id?: string | null
          wa?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          foto_url?: string | null
          hobi?: string | null
          id?: string
          ig?: string | null
          motto?: string | null
          nama?: string
          nim?: string | null
          panggilan?: string | null
          role?: Database["public"]["Enums"]["anggota_role"]
          tempat_lahir?: string | null
          tgl_lahir?: string | null
          urutan?: number | null
          user_id?: string | null
          wa?: string | null
        }
        Relationships: []
      }
      event_akademik: {
        Row: {
          created_at: string
          id: string
          jenis: Database["public"]["Enums"]["event_jenis"]
          nama: string
          tanggal_mulai: string
          tanggal_selesai: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jenis?: Database["public"]["Enums"]["event_jenis"]
          nama: string
          tanggal_mulai: string
          tanggal_selesai?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jenis?: Database["public"]["Enums"]["event_jenis"]
          nama?: string
          tanggal_mulai?: string
          tanggal_selesai?: string | null
        }
        Relationships: []
      }
      forum_balasan: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          isi: string
          topik_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          isi: string
          topik_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          isi?: string
          topik_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_balasan_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "anggota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_balasan_topik_id_fkey"
            columns: ["topik_id"]
            isOneToOne: false
            referencedRelation: "forum_topik"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topik: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          isi: string
          judul: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          isi: string
          judul: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          isi?: string
          judul?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topik_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "anggota"
            referencedColumns: ["id"]
          },
        ]
      }
      foto: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          tanggal: string
          uploader_id: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          tanggal?: string
          uploader_id?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          tanggal?: string
          uploader_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "foto_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "anggota"
            referencedColumns: ["id"]
          },
        ]
      }
      jadwal: {
        Row: {
          created_at: string
          dosen: string | null
          hari: number
          id: string
          jam_mulai: string
          jam_selesai: string
          matkul: string
          ruangan: string | null
        }
        Insert: {
          created_at?: string
          dosen?: string | null
          hari: number
          id?: string
          jam_mulai: string
          jam_selesai: string
          matkul: string
          ruangan?: string | null
        }
        Update: {
          created_at?: string
          dosen?: string | null
          hari?: number
          id?: string
          jam_mulai?: string
          jam_selesai?: string
          matkul?: string
          ruangan?: string | null
        }
        Relationships: []
      }
      kas_pembayaran: {
        Row: {
          anggota_id: string
          id: string
          jumlah: number
          periode_id: string
          status: Database["public"]["Enums"]["kas_status"]
          tanggal: string | null
        }
        Insert: {
          anggota_id: string
          id?: string
          jumlah?: number
          periode_id: string
          status?: Database["public"]["Enums"]["kas_status"]
          tanggal?: string | null
        }
        Update: {
          anggota_id?: string
          id?: string
          jumlah?: number
          periode_id?: string
          status?: Database["public"]["Enums"]["kas_status"]
          tanggal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kas_pembayaran_anggota_id_fkey"
            columns: ["anggota_id"]
            isOneToOne: false
            referencedRelation: "anggota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kas_pembayaran_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "kas_periode"
            referencedColumns: ["id"]
          },
        ]
      }
      kas_periode: {
        Row: {
          created_at: string
          id: string
          label: string
          nominal_per_orang: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          nominal_per_orang?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          nominal_per_orang?: number
        }
        Relationships: []
      }
      materi: {
        Row: {
          created_at: string
          id: string
          judul: string
          link: string
          matkul: string
        }
        Insert: {
          created_at?: string
          id?: string
          judul: string
          link: string
          matkul: string
        }
        Update: {
          created_at?: string
          id?: string
          judul?: string
          link?: string
          matkul?: string
        }
        Relationships: []
      }
      pending_akses: {
        Row: {
          catatan: string | null
          created_at: string
          email: string
          foto_google: string | null
          id: string
          nama_google: string | null
          user_id: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          email: string
          foto_google?: string | null
          id?: string
          nama_google?: string | null
          user_id: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          email?: string
          foto_google?: string | null
          id?: string
          nama_google?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pengeluaran: {
        Row: {
          created_at: string
          deskripsi: string
          id: string
          jumlah: number
          tanggal: string
        }
        Insert: {
          created_at?: string
          deskripsi: string
          id?: string
          jumlah: number
          tanggal?: string
        }
        Update: {
          created_at?: string
          deskripsi?: string
          id?: string
          jumlah?: number
          tanggal?: string
        }
        Relationships: []
      }
      titah: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          isi: string
          judul: string
          pinned: boolean
          tanggal: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          isi: string
          judul: string
          pinned?: boolean
          tanggal?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          isi?: string
          judul?: string
          pinned?: boolean
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "titah_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "anggota"
            referencedColumns: ["id"]
          },
        ]
      }
      tugas: {
        Row: {
          created_at: string
          deadline: string
          id: string
          judul: string
          matkul: string
          status: Database["public"]["Enums"]["tugas_status"]
        }
        Insert: {
          created_at?: string
          deadline: string
          id?: string
          judul: string
          matkul: string
          status?: Database["public"]["Enums"]["tugas_status"]
        }
        Update: {
          created_at?: string
          deadline?: string
          id?: string
          judul?: string
          matkul?: string
          status?: Database["public"]["Enums"]["tugas_status"]
        }
        Relationships: []
      }
      tugas_completion: {
        Row: {
          anggota_id: string
          completed_at: string
          id: string
          tugas_id: string
        }
        Insert: {
          anggota_id: string
          completed_at?: string
          id?: string
          tugas_id: string
        }
        Update: {
          anggota_id?: string
          completed_at?: string
          id?: string
          tugas_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tugas_completion_anggota_id_fkey"
            columns: ["anggota_id"]
            isOneToOne: false
            referencedRelation: "anggota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tugas_completion_tugas_id_fkey"
            columns: ["tugas_id"]
            isOneToOne: false
            referencedRelation: "tugas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_anggota_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["anggota_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      anggota_role:
        | "manager"
        | "yang_mulia"
        | "sekretaris"
        | "bendahara"
        | "bangsawan"
      event_jenis: "uts" | "uas" | "libur" | "lainnya"
      kas_status: "belum" | "lunas"
      tugas_status: "belum" | "dikerjakan" | "selesai"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      anggota_role: [
        "manager",
        "yang_mulia",
        "sekretaris",
        "bendahara",
        "bangsawan",
      ],
      event_jenis: ["uts", "uas", "libur", "lainnya"],
      kas_status: ["belum", "lunas"],
      tugas_status: ["belum", "dikerjakan", "selesai"],
    },
  },
} as const
