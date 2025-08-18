import { ChangeDetectionStrategy, Component, computed, inject, input, signal, WritableSignal } from '@angular/core';
import { DateView } from '@/core/components';
import { TranslocoDirective } from '@jsverse/transloco';
import { Badge, BadgeType } from '@scb/ui/badge';
import { Card } from '@scb/ui/card';
import { Icon } from '@scb/ui/icon';
import { Separator } from '@scb/ui/separator';
import { Timeline, TimelineSub, TimelineTitle } from '../timeline.ng';
import { LevelUser, TimelineRes } from './model';

interface ApprovalList {
  level: string;
  status: 'REJECTED' | 'PENDING' | 'APPROVED';
  approvedBy?: string;
  createdAt?: string;
  expanded?: WritableSignal<boolean>;
  reason?: string;
  users?: LevelUser[];
  isCore: boolean;
}

@Component({
  selector: 'app-delegation-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DateView, DateView, Timeline, TimelineTitle, TimelineSub, Icon, TranslocoDirective, Card, Badge, Separator],
  template: `
    <scb-card
      class="border-border-secondary gap-xl flex flex-col border"
      *transloco="let t; prefix: 'products'">
      <div class="gap-xl flex items-center">
        <div class="gap-sm grid flex-1">
          <h4 class="head-xs-s">{{ t('timelineTitle') }}</h4>
          <p class="body-sm text-text-secondary">{{ t('timelineSub') }}</p>
        </div>
        <div>
          @if (detailStatus(); as ds) {
            <scb-badge
              size="xs"
              [variant]="ds">
              {{ t(status()) }}
            </scb-badge>
          }
        </div>
      </div>
      <scb-separator />

      <div>
        <div class="gap-xl ng-star-inserted flex">
          <div class="flex w-3xl flex-col items-center">
            <div class="h-xl bg-brand ng-star-inserted m-sm w-xl rounded-full"></div>
            <div class="border-border-hard ng-star-inserted w-[1px] flex-1 border border-dashed"></div>
          </div>
          <div class="gap-md pb-3xl flex flex-col">
            <div class="gap-md flex">
              {{ t('submittedBy') }},
              <span class="body-md-s">{{ timeline().user.name }}</span>
            </div>
            <div class="body-md text-text-secondary">
              <date-view
                [value]="timeline().user.date"
                format="d MMM yyyy, h:mm a"
                class="mf-sm"></date-view>
            </div>
          </div>
        </div>
        @for (approval of timeline().approvals; track approval) {
          @let isApproved = approval.status === 'APPROVED';
          @let isRejected = approval.status === 'REJECTED';
          @let showUsers = !isApproved && !isRejected && approval.users?.length;
          <app-timeline
            [isLast]="$last"
            [status]="isApproved ? 'approved' : isRejected ? 'rejected' : 'pending'">
            <div timelineTitle>
              {{ approval.level }}
              @if (showUsers && (approval.users?.length ?? 0) > 1) {
                <icon
                  name="arrow-down"
                  (click)="approval?.expanded?.set(!approval.expanded?.())"
                  class="text-icon-brand w-2xl cursor-pointer" />
              }
            </div>
            @if (!approval.isCore && approval.status !== 'PENDING') {
              <ng-container>
                <div timelineSub>
                  {{ t('by') }}
                  <span class="head-2xs-s text-text-primary">{{ approval.approvedBy }}</span>
                  @if (approval.approvedBy === 'Abdelrahman Fisal') {
                    ({{ t('you') }})
                  }
                </div>
                <date-view
                  [value]="approval.createdAt"
                  format="d MMM yyyy, h:mm a"
                  class="mf-sm" />
              </ng-container>
            }
            @if (showUsers) {
              @if (approval.expanded?.()) {
                @for (u of approval.users; track u.name) {
                  <div class="body-md">{{ u.name }}</div>
                }
              } @else {
                <div class="body-md">
                  {{ approval.users![0].name }}
                  @if (approval.users!.length - 1 > 0) {
                    +{{ approval.users!.length - 1 }}
                  }
                </div>
              }
            }
          </app-timeline>
        }
      </div>
    </scb-card>
  `,
  host: {
    class: 'md:w-[397px]',
  },
})
export class DelegationTimeline {
  readonly data = input<TimelineRes>();
  readonly status = input.required<string>();
  readonly extras = input<{ submittedBy: string; date: string; approvals: number }>();

  readonly detailStatus = computed<BadgeType | undefined>(() => {
    const type = this.status();
    const dd: Record<string, BadgeType> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'red',
      CANCELLED: 'grey',
      WITHDRAW: 'grey',
    };
    return type ? dd[type] : undefined;
  });

  readonly timeline = computed(() => {
    const data = this.data();
    const d = this.extras();
    const allUsers = data?.users || {};
    return {
      user: {
        name: d?.submittedBy,
        date: d?.date,
      },
      approvals: <ApprovalList[]>[
        ...Array.from({ length: d?.approvals || 0 }, (x, i) => {
          const role = `CHECKER_LEVEL_${i + 1}`;
          const users = allUsers[role];
          const approval = data?.approvalRejection.find(x => x.role.toUpperCase() === role);
          const v: ApprovalList = {
            level: `Level ${i + 1}`,
            status: 'PENDING',
            expanded: signal(false),
            users,
            isCore: false,
          };
          if (approval) {
            v.approvedBy = approval.approverName;
            v.status = approval.status as any;
            v.createdAt = approval.createdAt;
            v.reason = approval.note;
          }
          return v;
        }),
        {
          level: 'Sent to core banking',
          status: 'pending',
          isCore: true,
        },
      ],
    };
  });
}
