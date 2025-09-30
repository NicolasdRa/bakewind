DROP INDEX "idx_session_active_user";--> statement-breakpoint
DROP INDEX "idx_session_cleanup";--> statement-breakpoint
CREATE INDEX "idx_session_active_user" ON "user_sessions" USING btree ("user_id","is_revoked","expires_at");--> statement-breakpoint
CREATE INDEX "idx_session_cleanup" ON "user_sessions" USING btree ("expires_at","is_revoked");