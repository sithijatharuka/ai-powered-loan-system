"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type Officer = {
  id: string;
  username: string;
  role: "admin" | "officer";
  createdAt?: string;
};

export default function Settings() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOfficerDialogOpen, setAddOfficerDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [officerToDelete, setOfficerToDelete] = useState<{ id: string; username: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    area: "",
    password: "",
  });

  async function loadOfficers() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register?role=officer");
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to load officers");
        setOfficers([]);
        return;
      }

      setOfficers((data.users ?? []) as Officer[]);
    } catch {
      toast.error("Failed to load officers");
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOfficers();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleAddOfficer() {
    try {
      setSaving(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.name,
          password: formData.password,
          role: "officer",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to save officer");
        return;
      }

      await loadOfficers();

      setFormData({
        name: "",
        email: "",
        phone: "",
        area: "",
        password: "",
      });

      setAddOfficerDialogOpen(false);
      toast.success("Officer added successfully");
    } catch {
      toast.error("Failed to save officer");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(officerId: string, username: string) {
    setOfficerToDelete({ id: officerId, username });
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!officerToDelete) return;

    try {
      setDeletingId(officerToDelete.id);

      const response = await fetch(`/api/auth/register?id=${officerToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete officer");
        return;
      }

      toast.success("Officer deleted successfully");
      await loadOfficers();
      setDeleteDialogOpen(false);
      setOfficerToDelete(null);
    } catch {
      toast.error("Failed to delete officer");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage collection officers
          </p>
        </div>

        {/* ADD OFFICER DIALOG */}
        <Dialog
          open={addOfficerDialogOpen}
          onOpenChange={(open) => {
            setAddOfficerDialogOpen(open);
            if (!open) {
              setFormData({
                name: "",
                email: "",
                phone: "",
                area: "",
                password: "",
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="cursor-pointer w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10">
              Add Collection Officer
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-112.5 rounded-2xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Add Collection Officer
              </DialogTitle>
            </DialogHeader>

            {/* FORM */}
            <div className="grid grid-cols-1 gap-4 py-4">
              {/* NAME */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">User Name</Label>

                <Input
                  name="name"
                  placeholder="Enter user name"
                  value={formData.name}
                  onChange={handleChange}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>

              {/* PHONE */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Password</Label>

                <Input
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end">
              <Button
                onClick={handleAddOfficer}
                className="rounded-xl w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Officer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* OFFICERS TABLE */}
      <div className="border rounded-xl overflow-hidden bg-white overflow-x-auto">
        <Table>
          {/* HEADER */}
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                ID
              </TableHead>

              <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                Name
              </TableHead>

              <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                Role
              </TableHead>

              <TableHead className="whitespace-nowrap text-xs sm:text-sm text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          {/* BODY */}
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-zinc-500 text-xs sm:text-sm"
                >
                  Loading officers...
                </TableCell>
              </TableRow>
            ) : officers.length > 0 ? (
              officers.map((officer) => (
                <TableRow key={officer.id}>
                  <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                    {officer.id.slice(-6)}
                  </TableCell>

                  <TableCell className="text-xs sm:text-sm">
                    {officer.username}
                  </TableCell>

                  <TableCell className="capitalize text-xs sm:text-sm whitespace-nowrap">
                    {officer.role}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(officer.id, officer.username)}
                      disabled={deletingId === officer.id}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === officer.id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-zinc-500 text-xs sm:text-sm"
                >
                  No officers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-md rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Officer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete officer &quot;{officerToDelete?.username}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={!!deletingId}
              className="text-xs sm:text-sm h-9 sm:h-10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!!deletingId}
              className="text-xs sm:text-sm h-9 sm:h-10"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
