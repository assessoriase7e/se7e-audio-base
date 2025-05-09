"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkModal } from "./link-modal";
import { DeleteLinkModal } from "./delete-link-modal";
import { Pagination } from "@/components/ui/pagination";
import { Pencil, Trash2, ExternalLink, LinkIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createLink } from "@/actions/links/create";
import { updateLink } from "@/actions/links/update";
import { deleteLink } from "@/actions/links/delete";
import { toast } from "sonner";
import { truncateText } from "@/lib/utils";
import { Link } from "@prisma/client";
import { useUser } from "@clerk/nextjs";

type LinksContentProps = {
  links: Link[];
  totalPages: number;
  currentPage: number;
};

export function LinksContent({
  links,
  totalPages,
  currentPage,
}: LinksContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = currentPage || Number(searchParams.get("page") || "1");

  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [deletingLink, setDeletingLink] = useState<any | null>(null);

  const { user } = useUser();

  async function handleCreateLink(data: any) {
    try {
      setIsLoading(true);
      const result = await createLink(data);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.refresh();
      setIsCreateModalOpen(false);
      toast("Link criado com sucesso!");
    } catch (error) {
      console.error("Error creating link:", error);
      toast.error("Erro ao criar link");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateLink(data: any) {
    try {
      setIsLoading(true);
      if (!editingLink) return;

      const result = await updateLink(editingLink.id, user?.id!, data);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.refresh();
      setEditingLink(null);
      toast("Link atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating link:", error);
      toast.error("Erro ao atualizar link");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteLink() {
    try {
      setIsLoading(true);
      if (!deletingLink) return;

      const result = await deleteLink(deletingLink.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.refresh();
      setDeletingLink(null);
      toast("Link excluído com sucesso!");
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error("Erro ao excluir link");
    } finally {
      setIsLoading(false);
    }
  }

  function handlePageChange(newPage: number) {
    router.push(`/links?page=${newPage}`);
  }

  function openExternalLink(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <LinkIcon className="mr-2 h-4 w-4" /> Novo link
        </Button>
      </div>

      {/* Visualização Desktop */}
      <div className="rounded-md border hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Nenhum link encontrado.
                </TableCell>
              </TableRow>
            ) : (
              links.map((link: Link) => (
                <TableRow key={link.id}>
                  <TableCell>{link.title}</TableCell>

                  <TableCell>
                    <div className="flex items-center">
                      <span className="truncate max-w-[200px]">{link.url}</span>
                    </div>
                  </TableCell>
                  <TableCell>{truncateText(link.description, 30)}</TableCell>

                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openExternalLink(link.url)}
                        title="Abrir link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingLink(link)}
                        title="Editar link"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeletingLink(link)}
                        title="Excluir link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Visualização Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground rounded-md border">
            Carregando...
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground rounded-md border">
            Nenhum link encontrado
          </div>
        ) : (
          links.map((link) => (
            <div key={link.id} className="rounded-md border p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-medium">{link.title}</h3>
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {link.url}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {truncateText(link.description, 30)}
                  </p>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openExternalLink(link.url)}
                    title="Abrir link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditingLink(link)}
                    title="Editar link"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeletingLink(link)}
                    title="Excluir link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

      <LinkModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Criar Link"
        description="Adicione um novo link ao sistema."
        onSubmit={handleCreateLink}
      />

      {editingLink && (
        <LinkModal
          isOpen={!!editingLink}
          onClose={() => setEditingLink(null)}
          title="Editar Link"
          description="Atualize as informações do link."
          initialData={{
            url: editingLink.url,
            title: editingLink.title,
            description: editingLink.description,
          }}
          onSubmit={handleUpdateLink}
        />
      )}

      {deletingLink && (
        <DeleteLinkModal
          isOpen={!!deletingLink}
          onClose={() => setDeletingLink(null)}
          onConfirm={handleDeleteLink}
          linkTitle={deletingLink.title}
        />
      )}
    </div>
  );
}
