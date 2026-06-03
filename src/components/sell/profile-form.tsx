"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/app/(main)/sell/profile/actions";

export function ProfileForm({
  initial,
}: {
  initial: {
    name: string;
    image: string;
    headline: string;
    bio: string;
    location: string;
    skills: string[];
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initial.name);
  const [image, setImage] = useState(initial.image);
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  const [skills, setSkills] = useState<string[]>(initial.skills);
  const [skillInput, setSkillInput] = useState("");

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 20) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfileAction({
        name: name.trim(),
        image: image.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        location: location.trim(),
        skills,
      });
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Profil disimpan");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nama</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="image">URL foto profil</Label>
        <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="mis. Desainer Logo & Branding"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Lokasi</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="mis. Jakarta" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Ceritakan pengalaman & keahlianmu..."
        />
      </div>
      <div className="space-y-2">
        <Label>Keahlian</Label>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="Tambah keahlian lalu Enter"
          />
          <Button type="button" variant="outline" onClick={addSkill}>Tambah</Button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan profil
        </Button>
      </div>
    </form>
  );
}
