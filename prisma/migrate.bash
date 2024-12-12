npx prisma migrate diff --from-url "postgresql://root:p2byfWvm46w1hgLQY098t7FAalBr5q3i@hkg1.clusters.zeabur.com:32699/test_tracks" --to-schema-datamodel ./schema.prisma --script > forward.sql
