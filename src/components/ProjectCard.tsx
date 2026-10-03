'use client';

import Link from 'next/link';
import { ArrowRight, Trash2 } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';
import type { Project } from '@/types';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  onDelete: (project: Project) => void;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const archived = Boolean(project.isArchived);
  const createdDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString()
    : 'Date unavailable';

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <span className={styles.mark} aria-hidden="true">
          {getInitials(project.name)}
        </span>
        <span className={`${styles.status} ${archived ? styles.statusArchived : ''}`}>
          {archived ? 'Archived' : 'Active'}
        </span>
        <OriginButton
          aria-label={`Delete ${project.name}`}
          title={`Delete ${project.name}`}
          onClick={() => onDelete(project)}
          className={styles.delete}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </OriginButton>
      </header>

      <div className={styles.body}>
        <h2 className={styles.title}>{project.name}</h2>
        <p className={styles.description}>
          {project.description?.trim() || 'No description provided.'}
        </p>
        <p className={styles.created}>Created {createdDate}</p>
      </div>

      <Link className={styles.cta} href={`/projects/${project.id}`}>
        Open project <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}