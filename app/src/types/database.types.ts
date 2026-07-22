// Tipos manuales que reflejan supabase/migrations/0001_init.sql y 0002_rpc_movimientos.sql.
// Si el esquema cambia, este archivo (o su reemplazo generado con
// `supabase gen types typescript`) debe actualizarse en paralelo.

export type MovementType = 'Entrada' | 'Salida' | 'Venta';

export type Profile = {
  id: string;
  usuario: string;
  nombre: string;
  rol: string;
  created_at: string;
}

export type Product = {
  id: number;
  descripcion: string;
  marca: string;
  presentacion: string;
  stock: number;
  stock_minimo: number;
  precio_venta: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type Movement = {
  id: number;
  tipo: MovementType;
  product_id: number;
  cantidad: number;
  observacion: string | null;
  fecha: string;
  created_by: string | null;
}

export type SaleInvoice = {
  id: number;
  cliente: string;
  total: number;
  fecha: string;
  created_by: string | null;
}

export type Sale = {
  id: number;
  sale_invoice_id: number;
  product_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export type InventoryValuationRow = {
  id: number;
  descripcion: string;
  marca: string;
  stock: number;
  precio_venta: number;
  subtotal: number;
}

type ProductFkRelationship = [
  {
    foreignKeyName: string;
    columns: ['product_id'];
    referencedRelation: 'products';
    referencedColumns: ['id'];
  },
];

type SalesRelationships = [
  {
    foreignKeyName: string;
    columns: ['product_id'];
    referencedRelation: 'products';
    referencedColumns: ['id'];
  },
  {
    foreignKeyName: string;
    columns: ['sale_invoice_id'];
    referencedRelation: 'sale_invoices';
    referencedColumns: ['id'];
  },
];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; usuario: string; nombre: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Partial<Product> & { descripcion: string };
        Update: Partial<Product>;
        Relationships: [];
      };
      movements: {
        Row: Movement;
        Insert: Partial<Movement> & { tipo: MovementType; product_id: number; cantidad: number };
        Update: Partial<Movement>;
        Relationships: ProductFkRelationship;
      };
      sales: {
        Row: Sale;
        Insert: Partial<Sale> & {
          sale_invoice_id: number;
          product_id: number;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
        };
        Update: Partial<Sale>;
        Relationships: SalesRelationships;
      };
      sale_invoices: {
        Row: SaleInvoice;
        Insert: Partial<SaleInvoice> & { cliente: string };
        Update: Partial<SaleInvoice>;
        Relationships: [];
      };
    };
    Views: {
      v_inventory_valuation: {
        Row: InventoryValuationRow;
        Relationships: [];
      };
    };
    Functions: {
      registrar_entrada: {
        Args: { p_product_id: number; p_cantidad: number };
        Returns: Movement;
      };
      registrar_salida: {
        Args: { p_product_id: number; p_cantidad: number; p_observacion: string };
        Returns: Movement;
      };
      registrar_venta: {
        Args: { p_cliente: string; p_items: unknown };
        Returns: SaleInvoice;
      };
    };
  };
}
