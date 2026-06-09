"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MailPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { api, type UserProfile } from "@/lib/api";
import { inviteUserSchema } from "@/lib/validation";

export function UsersPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserProfile[] | null>(null);

  const load = useCallback(
    () =>
      api
        .listUsers()
        .then(setUsers)
        .catch((e: unknown) => {
          toast.error(e instanceof Error ? e.message : "Could not load team");
          setUsers([]);
        }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    api
      .listUsers()
      .then((u) => {
        if (!cancelled) setUsers(u);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        toast.error(e instanceof Error ? e.message : "Could not load team");
        setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="cl-rise rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users className="size-4 text-primary" />
          Team
        </div>
        <InviteUserDialog onInvited={load} />
      </div>

      {users === null ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading team…
        </div>
      ) : users.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No team members yet. Invite the first nurse above.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full border border-primary/20 bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                {u.role === "admin" ? "Administrator" : "Nurse"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InviteUserDialog({ onInvited }: { onInvited: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "nurse">("nurse");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = inviteUserSchema.safeParse({ email: email.trim(), name: name.trim(), role });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await api.inviteUser(parsed.data);
      toast.success(`Invite sent to ${parsed.data.email}`);
      setOpen(false);
      setEmail("");
      setName("");
      setRole("nurse");
      await onInvited();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <MailPlus className="size-4" /> Invite user
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            They&apos;ll receive an email with a link to set their password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Name" error={errors.name} required>
            {(props) => (
              <Input
                {...props}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nurse Wong"
              />
            )}
          </Field>
          <Field label="Email" error={errors.email} required>
            {(props) => (
              <Input
                {...props}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nurse@hospital.hk"
              />
            )}
          </Field>
          <Field label="Role" error={errors.role} required>
            {(props) => (
              <NativeSelect
                {...props}
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "nurse")}
              >
                <option value="nurse">Nurse</option>
                <option value="admin">Administrator</option>
              </NativeSelect>
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
