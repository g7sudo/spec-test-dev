'use client';

/**
 * Lease Section Component
 * Displays leases for a unit with management actions
 * Used in Unit Detail page (Flow 4)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  Briefcase,
  Star,
  Mail,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLeasesByUnit, getLeaseById } from '@/lib/api/leases';
import { getInvitesByLease } from '@/lib/api/resident-invites';
import {
  Lease,
  LeaseSummary,
  LeaseParty,
  LeaseStatus,
  LeasePartyRole,
  getLeaseStatusLabel,
  getLeaseStatusColor,
  getLeasePartyRoleLabel,
  getLeasePartyRoleColor,
  formatLeaseDate,
  formatLeasePeriod,
  canActivateLease,
  canEndLease,
  isLeaseEditable,
} from '@/types/lease';
import { PartyType, getPartyTypeLabel } from '@/types/party';
import {
  ResidentInvite,
  ResidentInviteStatus,
  getInviteStatusLabel,
  getInviteStatusColor,
} from '@/types/resident-invite';
import {
  CreateLeaseDialog,
  AddLeasePartyDialog,
  ActivateLeaseDialog,
  EndLeaseDialog,
  RemoveLeasePartyDialog,
  SendResidentInviteDialog,
} from '@/components/leases';

// ============================================
// Types
// ============================================

interface LeaseSectionProps {
  unitId: string;
  unitNumber: string;
  canView: boolean;
  canManage: boolean;
}

// ============================================
// Party Type Icon
// ============================================

function PartyTypeIcon({ type }: { type: PartyType }) {
  switch (type) {
    case PartyType.Individual:
      return <User className="h-4 w-4" />;
    case PartyType.Company:
      return <Building2 className="h-4 w-4" />;
    case PartyType.Entity:
      return <Briefcase className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
}

// ============================================
// Lease Card Component
// ============================================

interface LeaseCardProps {
  lease: Lease;
  invites: ResidentInvite[];
  canManage: boolean;
  onActivate: () => void;
  onEnd: () => void;
  onAddParty: () => void;
  onRemoveParty: (party: LeaseParty) => void;
  onSendInvite: (party: LeaseParty) => void;
  onRefresh: () => void;
}

function LeaseCard({
  lease,
  invites,
  canManage,
  onActivate,
  onEnd,
  onAddParty,
  onRemoveParty,
  onSendInvite,
  onRefresh,
}: LeaseCardProps) {
  const [expanded, setExpanded] = useState(true);

  const isDraft = canActivateLease(lease.status);
  const isActive = canEndLease(lease.status);
  const isEditable = isLeaseEditable(lease.status);

  // Get residents only (for invite actions)
  const residents = lease.parties.filter(
    (p) =>
      p.role === LeasePartyRole.PrimaryResident ||
      p.role === LeasePartyRole.CoResident
  );

  // Get invite status for a party
  const getPartyInvite = (partyId: string): ResidentInvite | undefined => {
    return invites.find((i) => i.partyId === partyId);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Lease Header */}
      <div
        className="flex items-center justify-between p-4 bg-surface-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {formatLeasePeriod(lease.startDate, lease.endDate)}
              </span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLeaseStatusColor(
                  lease.status
                )}`}
              >
                {getLeaseStatusLabel(lease.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {lease.parties.length} {lease.parties.length === 1 ? 'party' : 'parties'}
              {lease.monthlyRent && ` • Rent: $${lease.monthlyRent.toLocaleString()}/mo`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && isDraft && (
            <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onActivate(); }}>
              <CheckCircle className="h-4 w-4" />
              Activate
            </Button>
          )}
          {canManage && isActive && (
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onEnd(); }}>
              <XCircle className="h-4 w-4" />
              End Lease
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Lease Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Start Date</span>
              <p className="font-medium">{formatLeaseDate(lease.startDate)}</p>
            </div>
            <div>
              <span className="text-gray-500">End Date</span>
              <p className="font-medium">{lease.endDate ? formatLeaseDate(lease.endDate) : 'Open-ended'}</p>
            </div>
            {lease.monthlyRent && (
              <div>
                <span className="text-gray-500">Monthly Rent</span>
                <p className="font-medium">${lease.monthlyRent.toLocaleString()}</p>
              </div>
            )}
            {lease.depositAmount && (
              <div>
                <span className="text-gray-500">Deposit</span>
                <p className="font-medium">${lease.depositAmount.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Parties Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Lease Parties
              </h4>
              {canManage && isEditable && (
                <Button variant="secondary" size="sm" onClick={onAddParty}>
                  <Plus className="h-4 w-4" />
                  Add Party
                </Button>
              )}
            </div>

            {lease.parties.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No parties added to this lease yet
              </p>
            ) : (
              <div className="space-y-2">
                {lease.parties.map((party) => {
                  const invite = getPartyInvite(party.partyId);
                  const isResident =
                    party.role === LeasePartyRole.PrimaryResident ||
                    party.role === LeasePartyRole.CoResident;

                  return (
                    <div
                      key={party.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-surface-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                          <PartyTypeIcon type={party.partyType} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {party.partyName}
                            </span>
                            {party.isPrimary && (
                              <Star className="h-4 w-4 text-amber-500" />
                            )}
                            {party.hasAppAccount && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                App User
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span
                              className={`inline-flex rounded-full px-1.5 py-0.5 ${getLeasePartyRoleColor(
                                party.role
                              )}`}
                            >
                              {getLeasePartyRoleLabel(party.role)}
                            </span>
                            {party.moveInDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatLeaseDate(party.moveInDate)}
                              </span>
                            )}
                            {invite && (
                              <span
                                className={`inline-flex rounded-full px-1.5 py-0.5 ${getInviteStatusColor(
                                  invite.status
                                )}`}
                              >
                                Invite: {getInviteStatusLabel(invite.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Party Actions */}
                      {canManage && (
                        <div className="flex items-center gap-2">
                          {/* Send Invite - only for residents without app account */}
                          {isResident && !party.hasAppAccount && isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSendInvite(party)}
                              title="Send app invite"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Remove - only for draft leases */}
                          {isEditable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveParty(party)}
                              className="text-gray-400 hover:text-red-600"
                              title="Remove from lease"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          {lease.notes && (
            <div className="text-sm">
              <span className="text-gray-500">Notes:</span>
              <p className="text-gray-700 mt-1 whitespace-pre-wrap">{lease.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function LeaseSection({
  unitId,
  unitNumber,
  canView,
  canManage,
}: LeaseSectionProps) {
  const fetchedRef = useRef(false);

  // Data state
  const [leases, setLeases] = useState<Lease[]>([]);
  const [invitesByLease, setInvitesByLease] = useState<Record<string, ResidentInvite[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [removingParty, setRemovingParty] = useState<LeaseParty | null>(null);
  const [invitingParty, setInvitingParty] = useState<LeaseParty | null>(null);

  // Load leases
  const loadLeases = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    try {
      // Get lease summaries
      const summariesResult = await getLeasesByUnit({ unitId, pageSize: 100 });

      // Load full details for each lease
      const leasesWithDetails = await Promise.all(
        summariesResult.items.map((summary) => getLeaseById(summary.id))
      );
      setLeases(leasesWithDetails);

      // Load invites for active leases
      const activeLeases = leasesWithDetails.filter(
        (l) => l.status === LeaseStatus.Active
      );
      const invitesMap: Record<string, ResidentInvite[]> = {};
      await Promise.all(
        activeLeases.map(async (lease) => {
          try {
            const invitesResult = await getInvitesByLease({ leaseId: lease.id, pageSize: 100 });
            invitesMap[lease.id] = invitesResult.items;
          } catch (err) {
            console.error(`Failed to load invites for lease ${lease.id}:`, err);
            invitesMap[lease.id] = [];
          }
        })
      );
      setInvitesByLease(invitesMap);
    } catch (err) {
      console.error('Failed to load leases:', err);
    } finally {
      setIsLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    if (canView) {
      loadLeases();
    }
  }, [canView, loadLeases]);

  // Handle create success
  const handleCreateSuccess = async (leaseId: string) => {
    setIsCreateOpen(false);
    fetchedRef.current = false;
    await loadLeases(true);
  };

  // Handle action success
  const handleActionSuccess = async () => {
    setIsActivateOpen(false);
    setIsEndOpen(false);
    setIsAddPartyOpen(false);
    setRemovingParty(null);
    setInvitingParty(null);
    setSelectedLease(null);
    fetchedRef.current = false;
    await loadLeases(true);
  };

  // Separate leases by status
  const activeLeases = leases.filter(
    (l) => l.status === LeaseStatus.Active
  );
  const draftLeases = leases.filter(
    (l) => l.status === LeaseStatus.Draft
  );
  const pastLeases = leases.filter(
    (l) =>
      l.status === LeaseStatus.Ended ||
      l.status === LeaseStatus.Terminated
  );

  if (!canView) {
    return null;
  }

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader
          title="Leases"
          description={
            activeLeases.length > 0
              ? `${activeLeases.length} active lease${activeLeases.length !== 1 ? 's' : ''}`
              : 'No active leases'
          }
          action={
            canManage && (
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Lease
              </Button>
            )
          }
        />
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : leases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-gray-500">
                No leases found for this unit
              </p>
              {canManage && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create First Lease
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Draft Leases */}
              {draftLeases.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Draft Leases
                  </h4>
                  <div className="space-y-3">
                    {draftLeases.map((lease) => (
                      <LeaseCard
                        key={lease.id}
                        lease={lease}
                        invites={invitesByLease[lease.id] || []}
                        canManage={canManage}
                        onActivate={() => {
                          setSelectedLease(lease);
                          setIsActivateOpen(true);
                        }}
                        onEnd={() => {
                          setSelectedLease(lease);
                          setIsEndOpen(true);
                        }}
                        onAddParty={() => {
                          setSelectedLease(lease);
                          setIsAddPartyOpen(true);
                        }}
                        onRemoveParty={(party) => {
                          setRemovingParty(party);
                        }}
                        onSendInvite={(party) => {
                          setSelectedLease(lease);
                          setInvitingParty(party);
                        }}
                        onRefresh={() => {
                          fetchedRef.current = false;
                          loadLeases(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Active Leases */}
              {activeLeases.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Active Leases
                  </h4>
                  <div className="space-y-3">
                    {activeLeases.map((lease) => (
                      <LeaseCard
                        key={lease.id}
                        lease={lease}
                        invites={invitesByLease[lease.id] || []}
                        canManage={canManage}
                        onActivate={() => {
                          setSelectedLease(lease);
                          setIsActivateOpen(true);
                        }}
                        onEnd={() => {
                          setSelectedLease(lease);
                          setIsEndOpen(true);
                        }}
                        onAddParty={() => {
                          setSelectedLease(lease);
                          setIsAddPartyOpen(true);
                        }}
                        onRemoveParty={(party) => {
                          setRemovingParty(party);
                        }}
                        onSendInvite={(party) => {
                          setSelectedLease(lease);
                          setInvitingParty(party);
                        }}
                        onRefresh={() => {
                          fetchedRef.current = false;
                          loadLeases(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Leases */}
              {pastLeases.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Past Leases
                  </h4>
                  <div className="space-y-3">
                    {pastLeases.map((lease) => (
                      <LeaseCard
                        key={lease.id}
                        lease={lease}
                        invites={[]}
                        canManage={false}
                        onActivate={() => {}}
                        onEnd={() => {}}
                        onAddParty={() => {}}
                        onRemoveParty={() => {}}
                        onSendInvite={() => {}}
                        onRefresh={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateLeaseDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        unitId={unitId}
        unitNumber={unitNumber}
        onSuccess={handleCreateSuccess}
      />

      <ActivateLeaseDialog
        open={isActivateOpen}
        onOpenChange={setIsActivateOpen}
        lease={selectedLease}
        onSuccess={handleActionSuccess}
      />

      <EndLeaseDialog
        open={isEndOpen}
        onOpenChange={setIsEndOpen}
        lease={selectedLease}
        onSuccess={handleActionSuccess}
      />

      {selectedLease && (
        <AddLeasePartyDialog
          open={isAddPartyOpen}
          onOpenChange={setIsAddPartyOpen}
          leaseId={selectedLease.id}
          leaseStartDate={selectedLease.startDate}
          existingParties={selectedLease.parties}
          onSuccess={handleActionSuccess}
        />
      )}

      <RemoveLeasePartyDialog
        open={!!removingParty}
        onOpenChange={(open) => !open && setRemovingParty(null)}
        leaseParty={removingParty}
        onSuccess={handleActionSuccess}
      />

      {selectedLease && (
        <SendResidentInviteDialog
          open={!!invitingParty}
          onOpenChange={(open) => !open && setInvitingParty(null)}
          leaseId={selectedLease.id}
          leaseParty={invitingParty}
          onSuccess={handleActionSuccess}
        />
      )}
    </>
  );
}


