 
import smartpy as sp

class TezosSecrets(sp.Contract):
    def __init__(self, admin):
        self.init(
            secrets = sp.big_map(
                l = {},
                tkey=sp.TNat,
                tvalue=sp.TRecord(
                    author=sp.TAddress,
                    secret=sp.TString,
                )
            ),
            secretCounter = 0,
            admin = admin,
            supporters = sp.big_map(
                l = {},
                tkey=sp.TNat,
                tvalue=sp.TRecord(
                    supporter=sp.TAddress,
                    amount=sp.TMutez,
                )
            ),
            supporterCounter = 0,
        )

    @sp.entry_point
    def postSecret(self, secret):

        sp.verify(sp.amount >= sp.utils.nat_to_mutez(100000))
        sp.verify(sp.len(secret) > 0)
        sp.verify(sp.len(secret) < 510)

        secret = sp.local('secret', sp.record(
                author=sp.sender,
                secret=secret,
            ))
        self.data.secrets[self.data.secretCounter] = secret.value
        self.data.secretCounter += 1

    @sp.entry_point
    def getFunds(self):
        sp.verify(sp.sender == self.data.admin)

        sp.send(self.data.admin, sp.balance)

    @sp.entry_point
    def sendTip(self):
        sp.verify(sp.amount >= sp.utils.nat_to_mutez(100000))

        dono = sp.local('dono', sp.record(
                supporter=sp.sender,
                amount=sp.amount,
            ))
        self.data.supporters[self.data.supporterCounter] = dono.value
        self.data.supporterCounter += 1

if "templates" not in __name__:
    @sp.add_test(name = "Tezos Secrets")
    def test():
        admin = sp.test_account("Admin")
        bill = sp.test_account("Bill")
        scenario = sp.test_scenario()

        c1 = TezosSecrets(admin=admin.address)
        scenario.h1("Deploy Contract")
        scenario += c1

        scenario.h1("Post a Secrets")
        c1.postSecret("test").run(sender = bill, amount = sp.mutez(100000))
        c1.postSecret("test2").run(sender = bill, amount = sp.mutez(100000))

        scenario.h1("Get Funds")
        c1.getFunds().run(sender = admin)

        scenario.h1("Send a Tip")
        c1.postSecret("test3").run(sender = bill, amount = sp.mutez(100000))
        c1.sendTip().run(sender = bill, amount = sp.mutez(100000))
