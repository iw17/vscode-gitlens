import { Uri } from 'vscode';
import { getAvatarUri } from '../../avatars';
import type { ContributorSorting, GravatarDefaultStyle } from '../../config';
import { configuration } from '../../system/configuration';
import { formatDate, fromNow } from '../../system/date';
import { memoize } from '../../system/decorators/memoize';
import { sortCompare } from '../../system/string';
import type { GitUser } from './user';

export interface ContributorSortOptions {
	current?: true;
	orderBy?: ContributorSorting;
}

export class GitContributor {
	static is(contributor: any): contributor is GitContributor {
		return contributor instanceof GitContributor;
	}

	static sort(contributors: GitContributor[], options?: ContributorSortOptions) {
		options = { current: true, orderBy: configuration.get('sortContributorsBy'), ...options };

		switch (options.orderBy) {
			case 'count:asc':
				return contributors.sort(
					(a, b) =>
						(a.current ? -1 : 1) - (b.current ? -1 : 1) ||
						a.count - b.count ||
						(a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0),
				);
			case 'date:desc':
				return contributors.sort(
					(a, b) =>
						(options.current ? (a.current ? -1 : 1) - (b.current ? -1 : 1) : 0) ||
						(b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) ||
						b.count - a.count,
				);
			case 'date:asc':
				return contributors.sort(
					(a, b) =>
						(options.current ? (a.current ? -1 : 1) - (b.current ? -1 : 1) : 0) ||
						(a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0) ||
						b.count - a.count,
				);
			case 'name:asc':
				return contributors.sort(
					(a, b) =>
						(a.current ? -1 : 1) - (b.current ? -1 : 1) ||
						sortCompare(a.name ?? a.username!, b.name ?? b.username!),
				);
			case 'name:desc':
				return contributors.sort(
					(a, b) =>
						(a.current ? -1 : 1) - (b.current ? -1 : 1) ||
						sortCompare(b.name ?? b.username!, a.name ?? a.username!),
				);
			case 'count:desc':
			default:
				return contributors.sort(
					(a, b) =>
						(a.current ? -1 : 1) - (b.current ? -1 : 1) ||
						b.count - a.count ||
						(b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0),
				);
		}
	}

	constructor(
		public readonly repoPath: string,
		public readonly name: string | undefined,
		public readonly email: string | undefined,
		public readonly count: number,
		public readonly date?: Date,
		public readonly current: boolean = false,
		public readonly stats?: {
			files: number;
			additions: number;
			deletions: number;
		},
		public readonly username?: string | undefined,
		private readonly avatarUrl?: string | undefined,
		public readonly id?: string | undefined,
	) {}

	get label(): string {
		return this.name ?? this.username!;
	}

	@memoize<GitContributor['formatDate']>(format => format ?? 'MMMM Do, YYYY h:mma')
	formatDate(format?: string | null): string {
		return this.date != null ? formatDate(this.date, format ?? 'MMMM Do, YYYY h:mma') : '';
	}

	formatDateFromNow(short?: boolean): string {
		return this.date != null ? fromNow(this.date, short) : '';
	}

	getAvatarUri(options?: { defaultStyle?: GravatarDefaultStyle; size?: number }): Uri | Promise<Uri> {
		if (this.avatarUrl != null) return Uri.parse(this.avatarUrl);

		return getAvatarUri(this.email, undefined /*this.repoPath*/, options);
	}

	getCoauthor(): string {
		return `${this.name}${this.email ? ` <${this.email}>` : ''}`;
	}
}

export function matchContributor(c: GitContributor, user: GitUser): boolean {
	return c.name === user.name && c.email === user.email && c.username === user.username;
}
